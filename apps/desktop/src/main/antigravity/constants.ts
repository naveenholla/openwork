/**
 * Constants used for Antigravity OAuth flows and Cloud Code Assist API integration.
 * These values are from Google's Antigravity IDE OAuth configuration.
 */

/**
 * OAuth client ID for Antigravity.
 */
export const ANTIGRAVITY_CLIENT_ID =
  '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com';

/**
 * OAuth client secret for Antigravity.
 */
export const ANTIGRAVITY_CLIENT_SECRET = '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';

/**
 * OAuth scopes required for Antigravity integrations.
 */
export const ANTIGRAVITY_SCOPES: readonly string[] = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/cclog',
  'https://www.googleapis.com/auth/experimentsandconfigs',
];

/**
 * OAuth redirect URI used by the local callback server.
 */
export const ANTIGRAVITY_REDIRECT_URI = 'http://localhost:51121/oauth-callback';

/**
 * Local server port for OAuth callback.
 */
export const ANTIGRAVITY_OAUTH_PORT = 51121;

/**
 * Root endpoints for the Antigravity API (in fallback order).
 */
export const ANTIGRAVITY_ENDPOINT_DAILY = 'https://daily-cloudcode-pa.sandbox.googleapis.com';
export const ANTIGRAVITY_ENDPOINT_AUTOPUSH = 'https://autopush-cloudcode-pa.sandbox.googleapis.com';
export const ANTIGRAVITY_ENDPOINT_PROD = 'https://cloudcode-pa.googleapis.com';

/**
 * Endpoint fallback order (daily → autopush → prod).
 */
export const ANTIGRAVITY_ENDPOINT_FALLBACKS = [
  ANTIGRAVITY_ENDPOINT_DAILY,
  ANTIGRAVITY_ENDPOINT_AUTOPUSH,
  ANTIGRAVITY_ENDPOINT_PROD,
] as const;

/**
 * Preferred endpoint order for project discovery (prod first, then fallbacks).
 */
export const ANTIGRAVITY_LOAD_ENDPOINTS = [
  ANTIGRAVITY_ENDPOINT_PROD,
  ANTIGRAVITY_ENDPOINT_DAILY,
  ANTIGRAVITY_ENDPOINT_AUTOPUSH,
] as const;

/**
 * Primary endpoint to use (daily sandbox).
 */
export const ANTIGRAVITY_ENDPOINT = ANTIGRAVITY_ENDPOINT_DAILY;

/**
 * Default project ID used when Antigravity does not return one.
 */
export const ANTIGRAVITY_DEFAULT_PROJECT_ID = 'rising-fact-p41fc';

/**
 * Request headers for Antigravity API calls.
 */
export const ANTIGRAVITY_HEADERS = {
  'User-Agent': 'antigravity/1.11.5 darwin/arm64',
  'X-Goog-Api-Client': 'google-cloud-sdk vscode_cloudshelleditor/0.1',
  'Client-Metadata':
    '{"ideType":"IDE_UNSPECIFIED","platform":"PLATFORM_UNSPECIFIED","pluginType":"GEMINI"}',
} as const;

/**
 * Google OAuth2 endpoints.
 */
export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json';

/**
 * Token refresh buffer (refresh 5 minutes before expiry).
 */
export const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

/**
 * Fetch timeout for API requests.
 */
export const FETCH_TIMEOUT_MS = 10000;
