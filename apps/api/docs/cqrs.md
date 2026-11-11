# CQRS in the api app

The api app separates **commands** (use cases that change state) from **queries** (use cases that only read), using [`@nestjs/cqrs`](https://docs.nestjs.com/recipes/cqrs.md). It is applied to the `auth` and `meetings` modules; new feature modules follow the same shape.

There are no events, sagas or separate read models yet: one database, one schema, one set of services. CQRS here means a clear, uniform split of the application layer, not a distributed architecture.

## Request flow

```
HTTP request
  → JwtAuthGuard           (protected routes only: 401 or sets request.user)
  → controller             validates the input (Zod schema), picks the caller's id
  → CommandBus / QueryBus  routes the message to its handler
  → handler                one use case; business rules and error mapping
  → service                persistence (Drizzle) and other infrastructure
  → result returned through the bus, serialized by Nest as the HTTP response
```

| Layer      | Responsibility                                                                                                       | Must not                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Controller | HTTP only: routes, `@Body({ schema })` validation, `@CurrentUser()`, building the command/query and dispatching it   | contain logic or touch the database               |
| Command    | Immutable message: the data one state-changing use case needs, plus its result type                                  | contain behavior                                  |
| Query      | Immutable message: the data one read-only use case needs, plus its result type                                       | change state                                      |
| Handler    | Executes exactly one command or query; throws Nest `HttpException`s (`NotFoundException`, `ConflictException`, etc.) | know about HTTP requests, or call another handler |
| Service    | Persistence and infrastructure (`UsersService`, `MeetingsService`, `AccessTokenService`)                             | decide which use case runs or format HTTP errors  |

## Commands vs queries

- A **command** changes application state. It is named in the imperative (`RegisterUserCommand`, `CreateMeetingCommand`) and dispatched with `CommandBus`.
- A **query** only reads. It is named after what it returns (`ListMeetingsQuery`, `GetMeetingQuery`) and dispatched with `QueryBus`.
- Decide by the effect, not by the HTTP verb: `POST /auth/login` is a **query** (`LoginQuery`) because it creates no state, even though it is a `POST`. Issuing a token is not persisted.
- A command may return a result (here: the created entity or a token); that is a pragmatic choice so the controller does not need a follow-up query.

## Anatomy of a use case

Each use case is three small pieces in the module's `commands/` or `queries/` folder:

```
src/meetings/
├── commands/
│   ├── create-meeting.command.ts    # the message
│   └── create-meeting.handler.ts    # the handler
├── queries/
│   ├── get-meeting.query.ts
│   ├── get-meeting.handler.ts
│   ├── list-meetings.query.ts
│   └── list-meetings.handler.ts
├── meetings.controller.ts           # dispatches to the buses
├── meetings.service.ts              # Drizzle wrapper
├── meetings.schemas.ts              # Zod input schemas
└── meetings.module.ts               # registers handlers as providers
```

### The message

Extend `Command<TResult>` or `Query<TResult>`. The generic type is the handler's result, so `commandBus.execute(...)` and `queryBus.execute(...)` are typed end to end. Carry only plain data, as `readonly` constructor properties:

```ts
// src/meetings/commands/create-meeting.command.ts
export class CreateMeetingCommand extends Command<Meeting> {
  constructor(
    public readonly ownerId: string,
    public readonly title: string,
    public readonly date: Date,
    public readonly participants: string[],
  ) {
    super();
  }
}
```

The message already contains the caller's id (`ownerId`). Handlers never read the request, so authorization data travels explicitly with the message.

### The handler

`@CommandHandler(Message)` / `@QueryHandler(Message)` plus `implements ICommandHandler<Message>` / `IQueryHandler<Message>`. It is a normal injectable class. Keep it thin: orchestrate services and map outcomes to errors.

```ts
// src/meetings/queries/get-meeting.handler.ts
@QueryHandler(GetMeetingQuery)
export class GetMeetingHandler implements IQueryHandler<GetMeetingQuery> {
  constructor(private readonly meetings: MeetingsService) {}

  async execute({ ownerId, id }: GetMeetingQuery): Promise<Meeting> {
    const meeting = await this.meetings.findOwned(id, ownerId);
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
    return meeting;
  }
}
```

Errors are thrown as Nest `HttpException`s and pass through the bus unchanged, so the HTTP status is decided in the handler (409 for a taken e-mail, 401 for bad credentials, 404 for a missing meeting).

### The controller

The controller only validates, builds the message and dispatches it:

```ts
@Post()
create(
  @CurrentUser() user: AuthenticatedUser,
  @Body({ schema: createMeetingSchema }) { title, date, participants }: CreateMeetingDto,
): Promise<Meeting> {
  return this.commandBus.execute(
    new CreateMeetingCommand(user.id, title, date, participants),
  );
}
```

Input validation stays in the controller layer (`StandardSchemaValidationPipe` with a Zod schema), so a handler can assume well-formed input.

### The module

Handlers are registered as providers; `CqrsModule.forRoot()` is imported once in `AppModule` and discovers them. No other wiring is needed.

```ts
@Module({
  imports: [AuthModule], // JwtAuthGuard for the controller
  controllers: [MeetingsController],
  providers: [
    MeetingsService,
    CreateMeetingHandler,
    ListMeetingsHandler,
    GetMeetingHandler,
  ],
})
export class MeetingsModule {}
```

A handler that is not listed in `providers` is silently never called: the bus then fails with "no handler" at runtime.

## Use cases today

| Module     | Message                | Type    | Result            | Errors                        |
| ---------- | ---------------------- | ------- | ----------------- | ----------------------------- |
| `auth`     | `RegisterUserCommand`  | command | `{ accessToken }` | 409 e-mail taken              |
| `auth`     | `LoginQuery`           | query   | `{ accessToken }` | 401 bad credentials           |
| `auth`     | `GetCurrentUserQuery`  | query   | `{ id, email }`   | 401 user no longer exists     |
| `meetings` | `CreateMeetingCommand` | command | `Meeting`         |                               |
| `meetings` | `ListMeetingsQuery`    | query   | `Meeting[]`       |                               |
| `meetings` | `GetMeetingQuery`      | query   | `Meeting`         | 404 not found / not the owner |

## Adding a use case

1. Decide: does it change state? Then it is a command, otherwise a query.
2. Create `<name>.command.ts` / `<name>.query.ts` extending `Command<TResult>` / `Query<TResult>` with `readonly` constructor properties, in the module's `commands/` or `queries/` folder.
3. Create `<name>.handler.ts` next to it with the matching decorator. Put persistence in a service, not in the handler.
4. Register the handler in the module's `providers`.
5. Add the controller method: validate the input with a Zod schema, build the message, call `commandBus.execute(...)` or `queryBus.execute(...)`.
6. Write the tests (below) and update this file's table.

## Rules of thumb

- One handler per message; a handler does not dispatch other commands or queries. If two use cases share logic, move it into a service.
- Handlers and controllers stay thin; logic that is not orchestration belongs in a service.
- Messages are plain data: no services, no `Request` objects, no behavior.
- Pass identity explicitly (`ownerId`) and scope data access by it in the service (`findOwned(id, ownerId)`), so a handler cannot forget the ownership check.
- Don't introduce events, sagas or a separate read model until a concrete need appears; add them as a deliberate architectural change and update this document.

## Testing

- **Handlers** are unit tested with `new`, no Nest testing module, and `vi.fn()` mocks for the services (`register-user.handler.spec.ts`, `login.handler.spec.ts`, `get-meeting.handler.spec.ts`). Assert the result, the error type and how the service was called. A query test also asserts that nothing is written.
- **Controllers** are unit tested with mocked buses: they must only build the right message and return what the bus returns (`auth.controller.spec.ts`).
- **End to end** (`test/*.e2e-spec.ts`): boot `AppModule` against the real database and call the HTTP API. This covers the wiring a unit test cannot: handler registration, validation, guards and status codes.
