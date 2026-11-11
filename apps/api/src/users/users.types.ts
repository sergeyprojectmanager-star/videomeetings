/** A user as other modules may see them: never the password hash. */
export interface UserProfile {
  id: string;
  email: string;
}

/**
 * A user together with the stored password hash. Only for the module that
 * verifies credentials (`auth`); never send it to a client.
 */
export interface UserCredentials extends UserProfile {
  passwordHash: string;
}
