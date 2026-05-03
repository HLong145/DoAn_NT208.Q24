import net from 'node:net';

const services = [
  { host: process.env.DB_HOST ?? 'localhost', port: Number(process.env.DB_PORT ?? 3306), name: 'mysql' },
  { host: process.env.REDIS_HOST ?? 'localhost', port: Number(process.env.REDIS_PORT ?? 6379), name: 'redis' },
  getKafkaTarget(),
];

const timeoutMs = Number(process.env.SERVICE_WAIT_TIMEOUT_MS ?? 120000);
const deadline = Date.now() + timeoutMs;

async function waitForService({ host, port, name }) {
  while (Date.now() < deadline) {
    const isReady = await canConnect(host, port);
    if (isReady) {
      console.log(`[wait] ${name} is ready at ${host}:${port}`);
      return;
    }

    await delay(2000);
  }

  throw new Error(`Timed out waiting for ${name} at ${host}:${port}`);
}

function getKafkaTarget() {
  const firstBroker = (process.env.KAFKA_BROKERS ?? 'kafka:9092').split(',')[0].trim();
  const [hostPart, portPart] = firstBroker.split(':');

  return {
    host: process.env.KAFKA_HOST ?? hostPart ?? 'kafka',
    port: Number(portPart ?? 9092),
    name: 'kafka',
  };
}

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });

    const finish = (result) => {
      socket.removeAllListeners();
      socket.end();
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(1500);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

for (const service of services) {
  await waitForService(service);
}
