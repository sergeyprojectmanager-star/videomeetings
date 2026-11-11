// The public API of the users module. Other modules import from here and from
// nowhere else in `src/users` (enforced by the `no-restricted-imports` lint
// rule): they talk to the module by dispatching these messages on the buses.
export { CreateUserCommand } from './commands/create-user.command.js';
export { FindUserByEmailQuery } from './queries/find-user-by-email.query.js';
export { FindUserByIdQuery } from './queries/find-user-by-id.query.js';
export type { UserCredentials, UserProfile } from './users.types.js';
export { UsersModule } from './users.module.js';
