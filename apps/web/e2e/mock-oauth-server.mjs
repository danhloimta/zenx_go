import http from 'node:http';
import { randomUUID } from 'node:crypto';

const port = Number(process.env.OAUTH_MOCK_PORT ?? 4400);

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);
  if (url.pathname === '/health') return json(response, 200, { status: 'ok' });

  const match = url.pathname.match(/^\/(google|facebook)\/(authorize|token|userinfo)$/);
  if (!match) return json(response, 404, { error: 'not_found' });

  const [, provider, operation] = match;
  if (operation === 'authorize') {
    const redirectUri = url.searchParams.get('redirect_uri');
    const state = url.searchParams.get('state');
    if (!redirectUri || !state) return json(response, 400, { error: 'missing_authorization_parameters' });
    const code = `${provider}-${randomUUID()}`;
    const callback = new URL(redirectUri);
    callback.searchParams.set('code', code);
    callback.searchParams.set('state', state);
    response.writeHead(302, { location: callback.toString() });
    response.end();
    return;
  }

  if (operation === 'token') {
    let body = '';
    for await (const chunk of request) body += chunk;
    const form = new URLSearchParams(body);
    const code = form.get('code') ?? '';
    if (!code.startsWith(`${provider}-`)) return json(response, 400, { error: 'invalid_code' });
    return json(response, 200, { access_token: `${code}-access-token`, token_type: 'Bearer' });
  }

  const accessToken = url.searchParams.get('access_token') ?? request.headers.authorization?.replace(/^Bearer\s+/i, '') ?? '';
  if (!accessToken.startsWith(`${provider}-`)) return json(response, 401, { error: 'invalid_token' });
  const identity = accessToken.replace(/-access-token$/, '');
  if (provider === 'google') {
    return json(response, 200, { sub: identity, email: `${identity}@example.com`, name: 'Mock Google Player', email_verified: true });
  }
  return json(response, 200, { id: identity, email: `${identity}@example.com`, name: 'Mock Facebook Player' });
});

server.listen(port, '127.0.0.1');
