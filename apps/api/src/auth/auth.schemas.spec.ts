import { loginSchema, registerSchema } from './auth.schemas.js';

describe('registerSchema', () => {
  const valid = { email: 'jane@example.test', password: 'password' };

  it('accepts a valid body', () => {
    expect(registerSchema.safeParse(valid).data).toEqual(valid);
  });

  it('trims and lower-cases the e-mail', () => {
    const result = registerSchema.safeParse({
      ...valid,
      email: '  Jane@Example.TEST  ',
    });

    expect(result.data?.email).toBe('jane@example.test');
  });

  it('does not change the password, spaces included', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: '  Pass word  ',
    });

    expect(result.data?.password).toBe('  Pass word  ');
  });

  it.each([
    [8, true],
    [128, true],
    [7, false],
    [129, false],
    [0, false],
  ])('for a password of %i characters, validity is %s', (length, valid_) => {
    const result = registerSchema.safeParse({
      ...valid,
      password: 'x'.repeat(length),
    });

    expect(result.success).toBe(valid_);
  });

  it.each([
    ['a missing e-mail', { password: 'password' }],
    ['a missing password', { email: 'jane@example.test' }],
    ['an empty body', {}],
    ['an e-mail without "@"', { email: 'jane', password: 'password' }],
    ['an e-mail without a domain', { email: 'jane@', password: 'password' }],
    ['an empty e-mail', { email: '', password: 'password' }],
    ['a non-string e-mail', { email: 1, password: 'password' }],
    [
      'a non-string password',
      { email: 'jane@example.test', password: 12345678 },
    ],
    ['null', null],
  ])('rejects %s', (_label, body) => {
    expect(registerSchema.safeParse(body).success).toBe(false);
  });

  it('drops unknown fields, so they cannot reach the handler', () => {
    const result = registerSchema.safeParse({
      ...valid,
      id: 'x',
      role: 'admin',
    });

    expect(result.data).toEqual(valid);
  });
});

describe('loginSchema', () => {
  const valid = { email: 'jane@example.test', password: 'p' };

  it('accepts a password shorter than the registration minimum', () => {
    expect(loginSchema.safeParse(valid).data).toEqual(valid);
  });

  it('trims and lower-cases the e-mail', () => {
    const result = loginSchema.safeParse({
      ...valid,
      email: '  Jane@Example.TEST ',
    });

    expect(result.data?.email).toBe('jane@example.test');
  });

  it.each([
    ['a missing e-mail', { password: 'p' }],
    ['a missing password', { email: 'jane@example.test' }],
    ['an empty password', { email: 'jane@example.test', password: '' }],
    ['an e-mail without "@"', { email: 'jane', password: 'p' }],
    ['a non-string password', { email: 'jane@example.test', password: 1 }],
    ['an empty body', {}],
  ])('rejects %s', (_label, body) => {
    expect(loginSchema.safeParse(body).success).toBe(false);
  });

  it('drops unknown fields', () => {
    const result = loginSchema.safeParse({ ...valid, role: 'admin' });

    expect(result.data).toEqual(valid);
  });
});
