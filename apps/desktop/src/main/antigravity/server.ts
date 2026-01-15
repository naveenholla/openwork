/**
 * Local HTTP server for OAuth callback handling.
 * Listens on localhost:51121 for the OAuth redirect.
 */

import * as http from 'http';
import { URL } from 'url';
import { ANTIGRAVITY_OAUTH_PORT } from './constants';

/**
 * OAuth callback parameters extracted from the redirect URL.
 */
export interface OAuthCallbackParams {
    code: string;
    state: string;
}

/**
 * Pending OAuth flow state.
 */
interface PendingOAuth {
    resolve: (params: OAuthCallbackParams) => void;
    reject: (error: Error) => void;
    state: string;
}

let server: http.Server | null = null;
let pendingOAuth: PendingOAuth | null = null;

/**
 * HTML response for successful OAuth callback.
 */
const SUCCESS_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Authentication Successful</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }
    h1 { margin-bottom: 0.5rem; }
    p { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <h1>✓ Authentication Successful</h1>
    <p>You can close this window and return to Openwork.</p>
  </div>
</body>
</html>
`;

/**
 * HTML response for failed OAuth callback.
 */
const ERROR_HTML = (error: string) => `
<!DOCTYPE html>
<html>
<head>
  <title>Authentication Failed</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }
    h1 { margin-bottom: 0.5rem; }
    p { opacity: 0.9; }
    code { background: rgba(0,0,0,0.2); padding: 0.2rem 0.5rem; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>✗ Authentication Failed</h1>
    <p>Error: <code>${error}</code></p>
    <p>Please close this window and try again.</p>
  </div>
</body>
</html>
`;

/**
 * Handle incoming HTTP requests.
 */
function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    if (!req.url) {
        res.writeHead(404);
        res.end('Not Found');
        return;
    }

    const parsedUrl = new URL(req.url, `http://localhost:${ANTIGRAVITY_OAUTH_PORT}`);

    // Only handle OAuth callback path
    if (parsedUrl.pathname !== '/oauth-callback') {
        res.writeHead(404);
        res.end('Not Found');
        return;
    }

    const code = parsedUrl.searchParams.get('code');
    const state = parsedUrl.searchParams.get('state');
    const error = parsedUrl.searchParams.get('error');

    // Handle OAuth error
    if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(ERROR_HTML(error));

        if (pendingOAuth) {
            pendingOAuth.reject(new Error(`OAuth error: ${error}`));
            pendingOAuth = null;
        }
        return;
    }

    // Validate required parameters
    if (!code || !state) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(ERROR_HTML('Missing code or state parameter'));

        if (pendingOAuth) {
            pendingOAuth.reject(new Error('Missing code or state parameter'));
            pendingOAuth = null;
        }
        return;
    }

    // Validate state matches pending request
    if (pendingOAuth && pendingOAuth.state !== state) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(ERROR_HTML('State mismatch - possible CSRF attack'));

        pendingOAuth.reject(new Error('State mismatch'));
        pendingOAuth = null;
        return;
    }

    // Success
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(SUCCESS_HTML);

    if (pendingOAuth) {
        pendingOAuth.resolve({ code, state });
        pendingOAuth = null;
    }
}

/**
 * Start the OAuth callback server.
 * Returns true if server started successfully.
 */
export async function startOAuthServer(): Promise<boolean> {
    if (server) {
        // Server already running
        return true;
    }

    return new Promise((resolve) => {
        server = http.createServer(handleRequest);

        server.on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'EADDRINUSE') {
                console.warn(`[Antigravity] OAuth server port ${ANTIGRAVITY_OAUTH_PORT} is in use`);
            } else {
                console.error('[Antigravity] OAuth server error:', err);
            }
            server = null;
            resolve(false);
        });

        server.listen(ANTIGRAVITY_OAUTH_PORT, 'localhost', () => {
            console.log(`[Antigravity] OAuth callback server listening on port ${ANTIGRAVITY_OAUTH_PORT}`);
            resolve(true);
        });
    });
}

/**
 * Stop the OAuth callback server.
 */
export function stopOAuthServer(): void {
    if (server) {
        server.close();
        server = null;
        console.log('[Antigravity] OAuth callback server stopped');
    }

    // Reject any pending OAuth
    if (pendingOAuth) {
        pendingOAuth.reject(new Error('OAuth server stopped'));
        pendingOAuth = null;
    }
}

/**
 * Wait for an OAuth callback.
 * Returns a promise that resolves with the callback parameters.
 *
 * @param state - The expected state parameter for CSRF validation
 * @param timeoutMs - Timeout in milliseconds (default: 5 minutes)
 */
export function waitForOAuthCallback(
    state: string,
    timeoutMs = 5 * 60 * 1000
): Promise<OAuthCallbackParams> {
    return new Promise((resolve, reject) => {
        // Cancel any existing pending OAuth
        if (pendingOAuth) {
            pendingOAuth.reject(new Error('New OAuth flow started'));
        }

        // Set up timeout
        const timeout = setTimeout(() => {
            if (pendingOAuth) {
                pendingOAuth.reject(new Error('OAuth callback timeout'));
                pendingOAuth = null;
            }
        }, timeoutMs);

        // Store pending OAuth with cleanup
        pendingOAuth = {
            resolve: (params) => {
                clearTimeout(timeout);
                resolve(params);
            },
            reject: (error) => {
                clearTimeout(timeout);
                reject(error);
            },
            state,
        };
    });
}

/**
 * Check if the OAuth server is running.
 */
export function isOAuthServerRunning(): boolean {
    return server !== null;
}
