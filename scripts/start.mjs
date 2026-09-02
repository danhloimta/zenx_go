import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));

function readEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  const values = {};
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

const fileEnv = {
  ...readEnvFile(`${rootDir}/.env`),
  ...readEnvFile(`${rootDir}/apps/api/.env`),
  ...readEnvFile(`${rootDir}/apps/web/.env.local`),
};

function configuredPort(name, fallback) {
  const value = process.env[name] ?? fileEnv[name];
  const port = Number(value ?? fallback);
  return Number.isInteger(port) && port > 0 && port < 65_536 ? port : fallback;
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    let settled = false;

    const finish = (available) => {
      if (settled) return;
      settled = true;
      if (server.listening) {
        server.close(() => resolve(available));
      } else {
        resolve(available);
      }
    };

    server.once('error', () => finish(false));
    server.once('listening', () => finish(true));
    server.listen({ host: '0.0.0.0', port });
  });
}

async function findAvailablePort(preferredPort, reservedPorts) {
  for (let offset = 0; offset < 100; offset += 1) {
    const port = preferredPort + offset;
    if (port >= 65_536 || reservedPorts.has(port)) continue;
    if (await isPortAvailable(port)) return port;
  }

  throw new Error(`No available port found from ${preferredPort} to ${preferredPort + 99}`);
}

function localApiBaseUrl(value, apiPort) {
  const fallback = `http://localhost:${apiPort}/api/v1`;
  if (!value) return fallback;

  try {
    const url = new URL(value);
    if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(url.hostname)) {
      url.port = String(apiPort);
      return url.toString().replace(/\/$/, '');
    }
    return value;
  } catch {
    return fallback;
  }
}

const reservedPorts = new Set();
const requestedApiPort = configuredPort('API_PORT', 4000);
const requestedWebPort = configuredPort('PORT', 3000);
const apiPort = await findAvailablePort(requestedApiPort, reservedPorts);
reservedPorts.add(apiPort);
const webPort = await findAvailablePort(requestedWebPort, reservedPorts);
const apiBaseUrl = localApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? fileEnv.NEXT_PUBLIC_API_BASE_URL, apiPort);
const configuredBaseDomain = process.env.PUBLIC_BASE_DOMAIN ?? fileEnv.PUBLIC_BASE_DOMAIN ?? 'localhost';
const configuredWebOrigin = process.env.PUBLIC_WEB_ORIGIN ?? (fileEnv.NODE_ENV === 'production' ? fileEnv.PUBLIC_WEB_ORIGIN : undefined) ?? `http://localhost:${webPort}`;

if (apiPort !== requestedApiPort || webPort !== requestedWebPort) {
  console.log(`[start] Port conflict detected; using API ${apiPort} and web ${webPort}.`);
} else {
  console.log(`[start] Using API ${apiPort} and web ${webPort}.`);
}

const turboCommand = process.platform === 'win32' ? `${rootDir}/node_modules/.bin/turbo.cmd` : `${rootDir}/node_modules/.bin/turbo`;
const child = spawn(turboCommand, ['start'], {
  cwd: rootDir,
  env: {
    ...process.env,
    API_PORT: String(apiPort),
    PORT: String(webPort),
    WEB_ORIGIN: `http://localhost:${webPort}`,
    PUBLIC_BASE_DOMAIN: configuredBaseDomain,
    PUBLIC_WEB_ORIGIN: configuredWebOrigin,
    NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
  },
  stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}

child.on('error', (error) => {
  console.error(`[start] Failed to launch Turbo: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code) => process.exit(code ?? 1));
