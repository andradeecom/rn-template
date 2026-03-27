export type UserRole = 'admin' | 'user' | 'manager';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  mustChangePassword: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: User;
};

export type RefreshResponse = {
  accessToken: string;
};
