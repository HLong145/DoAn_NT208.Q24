import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  handle: string;
  createdAt: string;
};

export type UserRecord = PublicUser & {
  passwordHash: string;
};

export type RegisterInput = {
  name?: string;
  username?: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: PublicUser;
};

export class AuthError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findByHandle(handle: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(user: UserRecord): Promise<UserRecord>;
}

export class AuthService {
  constructor(
    private readonly repository: UserRepository,
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: jwt.SignOptions['expiresIn'],
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const name = (input.name ?? input.username ?? '').trim();
    const email = normalizeEmail(input.email);
    const password = input.password;

    validateRegistrationInput(name, email, password);

    const existingUser = await this.repository.findByEmail(email);
    if (existingUser) {
      throw new AuthError(409, 'EMAIL_ALREADY_IN_USE', 'Email is already in use.');
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.repository.create({
      id,
      name,
      email,
      handle: createHandle(name, email, id),
      createdAt,
      passwordHash,
    });

    return this.createSession(user);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const email = normalizeEmail(input.email);
    const password = input.password;

    validateLoginInput(email, password);

    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new AuthError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    return this.createSession(user);
  }

  async me(token: string): Promise<PublicUser> {
    const payload = this.verifyToken(token);

    if (typeof payload.sub !== 'string') {
      throw new AuthError(401, 'INVALID_TOKEN', 'Token payload is invalid.');
    }

    const user = await this.repository.findById(payload.sub);
    if (!user) {
      throw new AuthError(404, 'USER_NOT_FOUND', 'User not found.');
    }

    return this.toPublicUser(user);
  }

  private createSession(user: UserRecord): AuthResponse {
    const publicUser = this.toPublicUser(user);
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        handle: user.handle,
      },
      this.jwtSecret,
      {
        expiresIn: this.jwtExpiresIn,
      },
    );

    return {
      token,
      user: publicUser,
    };
  }

  private verifyToken(token: string): jwt.JwtPayload {
    const decoded = jwt.verify(token, this.jwtSecret);

    if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
      throw new AuthError(401, 'INVALID_TOKEN', 'Token is invalid.');
    }

    return decoded as jwt.JwtPayload;
  }

  private toPublicUser(user: UserRecord): PublicUser {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateRegistrationInput(name: string, email: string, password: string): void {
  if (!name) {
    throw new AuthError(400, 'INVALID_NAME', 'Name is required.');
  }

  validateLoginInput(email, password);

  if (password.length < 8) {
    throw new AuthError(400, 'WEAK_PASSWORD', 'Password must be at least 8 characters long.');
  }
}

function validateLoginInput(identifier: string, password: string): void {
  if (!identifier) {
    throw new AuthError(400, 'INVALID_EMAIL', 'Email is required.');
  }

  if (!password) {
    throw new AuthError(400, 'INVALID_PASSWORD', 'Password is required.');
  }
}

function createHandle(name: string, email: string, userId: string): string {
  const baseHandle = (name || email.split('@')[0] || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 18) || 'user';

  return `${baseHandle}-${userId.slice(0, 6)}`;
}