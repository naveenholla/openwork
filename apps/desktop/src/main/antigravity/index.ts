/**
 * Barrel export for Antigravity module.
 */

export {
    // Token manager (main interface)
    login,
    logout,
    logoutAll,
    getAccounts,
    isAuthenticated,
    getValidAccessToken,
    getAnyValidAccessToken,
    cleanup,
    type AntigravityAccount,
    type LoginResult,
} from './token-manager';

export {
    // OAuth utilities
    buildAuthorizationUrl,
    exchangeCodeForTokens,
    refreshAccessToken,
    generatePKCE,
    decodeState,
    type PkcePair,
    type AuthState,
    type AuthorizationResult,
    type TokenExchangeResult,
    type TokenExchangeSuccess,
    type TokenExchangeFailure,
} from './oauth';

export {
    // Server utilities
    startOAuthServer,
    stopOAuthServer,
    isOAuthServerRunning,
    type OAuthCallbackParams,
} from './server';

export {
    // Constants
    ANTIGRAVITY_CLIENT_ID,
    ANTIGRAVITY_SCOPES,
    ANTIGRAVITY_ENDPOINT,
    ANTIGRAVITY_ENDPOINT_FALLBACKS,
    ANTIGRAVITY_HEADERS,
    ANTIGRAVITY_DEFAULT_PROJECT_ID,
} from './constants';
