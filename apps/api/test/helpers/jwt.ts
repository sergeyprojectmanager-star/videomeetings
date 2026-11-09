import { createHmac, timingSafeEqual } from 'node:crypto';

export interface JwtPayload {
  sub?: unknown;
  iat?: unknown;
  exp?: unknown;
  [claim: string]: unknown;
}

function encodeSegment(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

/**
 * Signs a JWT with HS256 over exactly the given payload.
 *
 * Meant for building forged or expired tokens in tests; real tokens come from
 * the API itself.
 */
export function signHs256Jwt(payload: JwtPayload, secret: string): string {
  const signingInput = `${encodeSegment({ alg: 'HS256', typ: 'JWT' })}.${encodeSegment(payload)}`;
  const signature = createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64url');
  return `${signingInput}.${signature}`;
}

function decodeSegment(segment: string): unknown {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
}

/**
 * Verifies an HS256-signed JWT and returns its payload.
 *
 * Deliberately independent of the implementation under test (no JWT library):
 * the e2e tests check the token against the contract, not against the code
 * that issued it. Throws if the token is malformed, uses another algorithm,
 * has a bad signature or has expired.
 */
export function verifyHs256Jwt(token: string, secret: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('A JWT must have exactly three dot-separated segments');
  }
  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  const header = decodeSegment(encodedHeader) as { alg?: unknown };
  if (header.alg !== 'HS256') {
    throw new Error(`Unexpected JWT algorithm: ${String(header.alg)}`);
  }

  const expected = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const actual = Buffer.from(encodedSignature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error('Invalid JWT signature');
  }

  const payload = decodeSegment(encodedPayload) as JwtPayload;
  if (typeof payload.exp !== 'number') {
    throw new Error('JWT has no numeric "exp" claim');
  }
  if (payload.exp * 1000 <= Date.now()) {
    throw new Error('JWT has expired');
  }
  return payload;
}
