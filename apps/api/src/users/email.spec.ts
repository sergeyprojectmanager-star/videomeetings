import { normalizeEmail } from './email.js';

describe('normalizeEmail', () => {
  it.each([
    ['jane@example.test', 'jane@example.test'],
    ['  jane@example.test  ', 'jane@example.test'],
    ['Jane@Example.TEST', 'jane@example.test'],
    ['\tJANE@EXAMPLE.TEST\n', 'jane@example.test'],
  ])('turns %j into %j', (input, expected) => {
    expect(normalizeEmail(input)).toBe(expected);
  });
});
