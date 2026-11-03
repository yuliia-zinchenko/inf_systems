export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  hasPassword: boolean;
  hasGoogle: boolean;
  createdAt: string;
}

/** Internal — never sent over HTTP. */
export interface UserRecord extends User {
  passwordHash: string | null;
  googleId: string | null;
}
