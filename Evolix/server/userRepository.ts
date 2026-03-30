import mysql, { Pool, RowDataPacket } from 'mysql2/promise';
import { UserRecord, UserRepository } from './auth';

type UserRow = RowDataPacket & {
  id: string;
  name: string;
  email: string;
  handle: string;
  password_hash: string;
  created_at: Date;
};

function createPoolFromDatabaseUrl(databaseUrl: string): Pool {
  const parsedUrl = new URL(databaseUrl);

  return mysql.createPool({
    host: parsedUrl.hostname,
    port: parsedUrl.port ? Number(parsedUrl.port) : 3306,
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database: parsedUrl.pathname.replace(/^\//, ''),
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: false,
  });
}

const pool = process.env.DATABASE_URL ? createPoolFromDatabaseUrl(process.env.DATABASE_URL) : null;

class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, UserRecord>();

  async findByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();

    for (const user of this.users.values()) {
      if (user.email === normalizedEmail) {
        return user;
      }
    }

    return null;
  }

  async findByHandle(handle: string): Promise<UserRecord | null> {
    const normalizedHandle = handle.trim().toLowerCase();

    for (const user of this.users.values()) {
      if (user.handle.toLowerCase() === normalizedHandle) {
        return user;
      }
    }

    return null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) ?? null;
  }

  async create(user: UserRecord): Promise<UserRecord> {
    this.users.set(user.id, user);
    return user;
  }
}

class MySqlUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    if (!pool) {
      return null;
    }

    const [rows] = await pool.execute<UserRow[]>(
      `SELECT id, name, email, handle, password_hash, created_at
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email.trim().toLowerCase()],
    );

    const user = rows[0];

    return user ? this.toUserRecord(user) : null;
  }

  async findByHandle(handle: string): Promise<UserRecord | null> {
    if (!pool) {
      return null;
    }

    const [rows] = await pool.execute<UserRow[]>(
      `SELECT id, name, email, handle, password_hash, created_at
       FROM users
       WHERE handle = ?
       LIMIT 1`,
      [handle.trim().toLowerCase()],
    );

    const user = rows[0];

    return user ? this.toUserRecord(user) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    if (!pool) {
      return null;
    }

    const [rows] = await pool.execute<UserRow[]>(
      `SELECT id, name, email, handle, password_hash, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    const user = rows[0];

    return user ? this.toUserRecord(user) : null;
  }

  async create(user: UserRecord): Promise<UserRecord> {
    if (!pool) {
      throw new Error('DATABASE_URL is not configured.');
    }

    await pool.execute(
      `INSERT INTO users (id, name, email, handle, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.name,
        user.email,
        user.handle,
        user.passwordHash,
        new Date(user.createdAt),
        new Date(user.createdAt),
      ],
    );

    return user;
  }

  private toUserRecord(user: UserRow): UserRecord {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      passwordHash: user.password_hash,
      createdAt: user.created_at instanceof Date ? user.created_at.toISOString() : new Date(user.created_at).toISOString(),
    };
  }
}

export function createUserRepository(): UserRepository {
  if (pool) {
    return new MySqlUserRepository();
  }

  return new InMemoryUserRepository();
}

export async function disconnectUserRepository(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}
