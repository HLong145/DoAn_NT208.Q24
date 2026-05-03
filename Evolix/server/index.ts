import 'dotenv/config';
import express from 'express';
import { AuthError, AuthService } from './auth';
import { createUserRepository, disconnectUserRepository } from './userRepository';

const app = express();
const port = Number(process.env.AUTH_API_PORT ?? 4001);
const authService = new AuthService(
  createUserRepository(),
  process.env.AUTH_JWT_SECRET ?? 'dev-auth-secret-change-me',
  (process.env.AUTH_JWT_EXPIRES_IN ?? '7d') as any,
);

app.use(express.json());

app.use((req, res, next) => {
  const origin = process.env.CLIENT_ORIGIN ?? '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/register', async (req, res) => {
  await handleRequest(res, () => authService.register(req.body));
});

app.post('/api/auth/login', async (req, res) => {
  await handleRequest(res, () => authService.login(req.body));
});

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.header('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authorization token is required.',
    });
    return;
  }

  await handleRequest(res, () => authService.me(token));
});

app.listen(port, () => {
  console.log(`Auth API listening on http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  await disconnectUserRepository();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectUserRepository();
  process.exit(0);
});

async function handleRequest<T>(res: express.Response, handler: () => Promise<T>): Promise<void> {
  try {
    const data = await handler();
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
}

function handleError(res: express.Response, error: unknown): void {
  if (error instanceof AuthError) {
    res.status(error.statusCode).json({
      error: error.code,
      message: error.message,
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong.',
  });
}