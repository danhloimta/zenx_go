import http from 'node:http';

const port = Number(process.env.GAME_SSO_MOCK_PORT ?? 4500);
let configuration = null;
let results = [];

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(body));
}

function callbackPage(response, ok) {
  response.writeHead(ok ? 200 : 502, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  response.end(`<!doctype html><title>Mock game SSO callback</title><main><h1>Mock game SSO callback</h1><p>${ok ? 'Game SSO exchange completed.' : 'Game SSO exchange failed.'}</p></main>`);
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) body += chunk;
  try { return JSON.parse(body || '{}'); } catch { return null; }
}

function identity(data) {
  const user = data?.user;
  return user && typeof user.username === 'string' ? { username: user.username } : undefined;
}

async function exchange(url, code, state, response) {
  if (!configuration || !code || !state) return callbackPage(response, false);
  try {
    const exchange = await fetch(`${configuration.apiBaseUrl}/game-sso/exchange`, {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${configuration.clientId}:${configuration.clientSecret}`).toString('base64')}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ code, redirect_uri: configuration.redirectUri }),
    });
    const body = await exchange.json().catch(() => ({}));
    // The mock intentionally retains only assertion-safe outcome data. Authorization
    // codes, credentials and secrets never enter result storage or server output.
    results.push({ state, status: exchange.status, identity: identity(body.data), errorCode: body.error?.code });
    return callbackPage(response, exchange.ok);
  } catch {
    results.push({ state, status: 502, errorCode: 'GAME_SSO_EXCHANGE_UNAVAILABLE' });
    return callbackPage(response, false);
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);
  if (request.method === 'GET' && url.pathname === '/health') return json(response, 200, { status: 'ok' });
  if (request.method === 'DELETE' && url.pathname === '/__test/results') {
    results = [];
    response.writeHead(204);
    return response.end();
  }
  if (request.method === 'GET' && url.pathname === '/__test/results') return json(response, 200, { results });
  if (request.method === 'POST' && url.pathname === '/__test/configure') {
    const input = await readJson(request);
    if (!input || !['apiBaseUrl', 'clientId', 'clientSecret', 'redirectUri'].every((key) => typeof input[key] === 'string' && input[key])) return json(response, 400, { error: 'invalid_configuration' });
    configuration = { apiBaseUrl: input.apiBaseUrl, clientId: input.clientId, clientSecret: input.clientSecret, redirectUri: input.redirectUri };
    results = [];
    response.writeHead(204);
    return response.end();
  }
  if (request.method === 'GET' && url.pathname === '/callback') return exchange(url, url.searchParams.get('code') ?? '', url.searchParams.get('state') ?? '', response);
  return json(response, 404, { error: 'not_found' });
});

server.listen(port, '127.0.0.1');
