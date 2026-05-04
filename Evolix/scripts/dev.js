import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import net from 'node:net';

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? (process.env.ComSpec ?? 'cmd.exe') : 'npm';
const apiPortCandidates = Array.from({ length: 20 }, (_, index) => 4001 + index);

let isShuttingDown = false;
const children = [];

async function main() {
  const apiPort = await findAvailablePort(apiPortCandidates);
  await writeLocalEnvFile(apiPort);
  const apiEnv = {
    ...process.env,
    AUTH_API_PORT: String(apiPort),
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN?.trim() || '*',
  };
  const clientEnv = {
    ...process.env,
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL?.trim() || `http://localhost:${apiPort}`,
  };

  const apiChild = startProcess('api', npmCommand, buildNpmArgs('api:dev'), apiEnv);
  await waitForHealthyApi(apiPort, apiChild);

  startProcess('client', npmCommand, buildNpmArgs('dev:client'), clientEnv);
}

function buildNpmArgs(scriptName) {
  if (!isWindows) {
    return ['run', scriptName];
  }

  return ['/d', '/s', '/c', `npm run ${scriptName}`];
}

function startProcess(label, command, args, env) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env,
  });

  children.push(child);

  child.on('error', (error) => {
    if (!isShuttingDown) {
      console.error(`[${label}] failed to start:`, error);
      shutdown(1);
    }
  });

  child.on('exit', (code, signal) => {
    if (isShuttingDown) {
      return;
    }

    if (signal) {
      console.error(`[${label}] exited due to ${signal}`);
      shutdown(1);
      return;
    }

    if (typeof code === 'number' && code !== 0) {
      console.error(`[${label}] exited with code ${code}`);
      shutdown(code);
      return;
    }

    shutdown(typeof code === 'number' ? code : 0);
  });

  return child;
}

async function findAvailablePort(portList) {
  for (const port of portList) {
    if (await canBindPort(port)) {
      return port;
    }
  }

  throw new Error(`No available port found for the auth API in ${portList.join(', ')}.`);
}

function canBindPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.unref();
    server.once('error', () => resolve(false));
    server.listen({ port, exclusive: true }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function waitForHealthyApi(port, apiChild, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (apiChild.exitCode !== null) {
      throw new Error(`[api] exited before becoming ready (code ${apiChild.exitCode ?? 'unknown'})`);
    }

    if (await isHealthyApi(port)) {
      console.log(`[api] ready at http://localhost:${port}`);
      return;
    }

    await delay(250);
  }

  throw new Error(`[api] did not become healthy on http://localhost:${port} within ${timeoutMs / 1000} seconds.`);
}

async function isHealthyApi(port) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1000);

  try {
    const response = await fetch(`http://localhost:${port}/api/health`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json().catch(() => null);
    return Boolean(payload && typeof payload === 'object' && payload.status === 'ok');
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function writeLocalEnvFile(apiPort) {
  const envPath = '.env.local';
  const apiBaseUrl = `http://localhost:${apiPort}`;

  let content = '';
  try {
    content = await readFile(envPath, 'utf8');
  } catch {
    content = '';
  }

  content = upsertEnvLine(content, 'AUTH_API_PORT', String(apiPort));
  content = upsertEnvLine(content, 'VITE_API_BASE_URL', apiBaseUrl);

  if (content.length > 0 && !content.endsWith('\n')) {
    content += '\n';
  }

  await writeFile(envPath, content || `AUTH_API_PORT="${apiPort}"\nVITE_API_BASE_URL="${apiBaseUrl}"\n`);
}

function upsertEnvLine(content, key, value) {
  const line = `${key}="${value}"`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  if (!content || content.endsWith('\n')) {
    return `${content}${line}\n`;
  }

  return `${content}\n${line}\n`;
}

function shutdown(exitCode) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exit(exitCode);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

void main().catch((error) => {
  console.error('[dev] failed to start workspace:', error);
  shutdown(1);
});