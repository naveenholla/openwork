/**
 * Antigravity OAuth implementation with PKCE support.
 * Handles Google OAuth2 authorization and token exchange for Antigravity access.
 */

import * as crypto from 'crypto';
import {
    ANTIGRAVITY_CLIENT_ID,
    ANTIGRAVITY_CLIENT_SECRET,
    ANTIGRAVITY_REDIRECT_URI,
    ANTIGRAVITY_SCOPES,
    ANTIGRAVITY_LOAD_ENDPOINTS,
    ANTIGRAVITY_ENDPOINT_FALLBACKS,
    ANTIGRAVITY_HEADERS,
    GOOGLE_AUTH_URL,
    GOOGLE_TOKEN_URL,
    GOOGLE_USERINFO_URL,
    FETCH_TIMEOUT_MS,
} from './constants';

/**
 * PKCE challenge/verifier pair.
 */
export interface PkcePair {
    challenge: string;
    verifier: string;
}

/**
 * State encoded in OAuth authorization URL.
 */
export interface AuthState {
    verifier: string;
    projectId: string;
}

/**
 * Result of building an authorization URL.
 */
export interface AuthorizationResult {
    url: string;
    verifier: string;
    state: string;
}

/**
 * Successful token exchange result.
 */
export interface TokenExchangeSuccess {
    type: 'success';
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    email?: string;
    projectId: string;
}

/**
 * Failed token exchange result.
 */
export interface TokenExchangeFailure {
    type: 'failed';
    error: string;
}

export type TokenExchangeResult = TokenExchangeSuccess | TokenExchangeFailure;

/**
 * Google OAuth token response.
 */
interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    token_type: string;
}

/**
 * Google userinfo response.
 */
interface GoogleUserInfo {
    email?: string;
    name?: string;
    picture?: string;
}

/**
 * Generate a cryptographically random string.
 */
function generateRandomString(length: number): string {
    const bytes = crypto.randomBytes(length);
    return bytes
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .slice(0, length);
}

/**
 * Generate a PKCE challenge/verifier pair.
 */
export function generatePKCE(): PkcePair {
    // Generate a 43-128 character verifier (we use 64)
    const verifier = generateRandomString(64);

    // Create SHA256 hash of verifier
    const hash = crypto.createHash('sha256').update(verifier).digest();

    // Base64url encode the hash
    const challenge = hash
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    return { verifier, challenge };
}

/**
 * Encode state object to base64url string.
 */
function encodeState(state: AuthState): string {
    return Buffer.from(JSON.stringify(state), 'utf8').toString('base64url');
}

/**
 * Decode state string back to object.
 */
export function decodeState(state: string): AuthState {
    const normalized = state.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const json = Buffer.from(padded, 'base64').toString('utf8');
    const parsed = JSON.parse(json);

    if (typeof parsed.verifier !== 'string') {
        throw new Error('Missing PKCE verifier in state');
    }

    return {
        verifier: parsed.verifier,
        projectId: typeof parsed.projectId === 'string' ? parsed.projectId : '',
    };
}

/**
 * Build the Google OAuth authorization URL with PKCE.
 */
export function buildAuthorizationUrl(projectId = ''): AuthorizationResult {
    const pkce = generatePKCE();
    const state = encodeState({ verifier: pkce.verifier, projectId });

    const url = new URL(GOOGLE_AUTH_URL);
    url.searchParams.set('client_id', ANTIGRAVITY_CLIENT_ID);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', ANTIGRAVITY_REDIRECT_URI);
    url.searchParams.set('scope', ANTIGRAVITY_SCOPES.join(' '));
    url.searchParams.set('code_challenge', pkce.challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('state', state);
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');

    return {
        url: url.toString(),
        verifier: pkce.verifier,
        state,
    };
}

/**
 * Fetch with timeout using AbortController.
 */
async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Calculate token expiry timestamp.
 */
function calculateTokenExpiry(startTime: number, expiresIn: number): number {
    // expiresIn is in seconds, convert to milliseconds
    return startTime + expiresIn * 1000;
}

/**
 * Fetch the Antigravity project ID from the Cloud Code Assist API.
 */
async function fetchProjectId(accessToken: string): Promise<string> {
    const errors: string[] = [];

    const loadHeaders: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'google-api-nodejs-client/9.15.1',
        'X-Goog-Api-Client': 'google-cloud-sdk vscode_cloudshelleditor/0.1',
        'Client-Metadata': ANTIGRAVITY_HEADERS['Client-Metadata'],
    };

    const loadEndpoints = Array.from(
        new Set<string>([...ANTIGRAVITY_LOAD_ENDPOINTS, ...ANTIGRAVITY_ENDPOINT_FALLBACKS])
    );

    for (const baseEndpoint of loadEndpoints) {
        try {
            const url = `${baseEndpoint}/v1internal:loadCodeAssist`;
            const response = await fetchWithTimeout(url, {
                method: 'POST',
                headers: loadHeaders,
                body: JSON.stringify({
                    metadata: {
                        ideType: 'IDE_UNSPECIFIED',
                        platform: 'PLATFORM_UNSPECIFIED',
                        pluginType: 'GEMINI',
                    },
                }),
            });

            if (!response.ok) {
                const message = await response.text().catch(() => '');
                errors.push(
                    `loadCodeAssist ${response.status} at ${baseEndpoint}${message ? `: ${message}` : ''}`
                );
                continue;
            }

            const data = await response.json();
            if (typeof data.cloudaicompanionProject === 'string' && data.cloudaicompanionProject) {
                return data.cloudaicompanionProject;
            }
            if (
                data.cloudaicompanionProject &&
                typeof data.cloudaicompanionProject.id === 'string' &&
                data.cloudaicompanionProject.id
            ) {
                return data.cloudaicompanionProject.id;
            }

            errors.push(`loadCodeAssist missing project id at ${baseEndpoint}`);
        } catch (e) {
            errors.push(
                `loadCodeAssist error at ${baseEndpoint}: ${e instanceof Error ? e.message : String(e)}`
            );
        }
    }

    if (errors.length) {
        console.warn('[Antigravity] Failed to resolve project via loadCodeAssist:', errors.join('; '));
    }

    return '';
}

/**
 * Exchange an authorization code for access and refresh tokens.
 */
export async function exchangeCodeForTokens(
    code: string,
    state: string
): Promise<TokenExchangeResult> {
    try {
        const { verifier, projectId } = decodeState(state);
        const startTime = Date.now();

        // Exchange code for tokens
        const tokenResponse = await fetchWithTimeout(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: ANTIGRAVITY_CLIENT_ID,
                client_secret: ANTIGRAVITY_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: ANTIGRAVITY_REDIRECT_URI,
                code_verifier: verifier,
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            return { type: 'failed', error: errorText };
        }

        const tokenPayload = (await tokenResponse.json()) as GoogleTokenResponse;

        // Fetch user info
        const userInfoResponse = await fetchWithTimeout(GOOGLE_USERINFO_URL, {
            headers: {
                Authorization: `Bearer ${tokenPayload.access_token}`,
            },
        });

        const userInfo = userInfoResponse.ok
            ? ((await userInfoResponse.json()) as GoogleUserInfo)
            : {};

        // Validate refresh token
        const refreshToken = tokenPayload.refresh_token;
        if (!refreshToken) {
            return { type: 'failed', error: 'Missing refresh token in response' };
        }

        // Fetch project ID if not provided
        let effectiveProjectId = projectId;
        if (!effectiveProjectId) {
            effectiveProjectId = await fetchProjectId(tokenPayload.access_token);
        }

        return {
            type: 'success',
            accessToken: tokenPayload.access_token,
            refreshToken,
            expiresAt: calculateTokenExpiry(startTime, tokenPayload.expires_in),
            email: userInfo.email,
            projectId: effectiveProjectId,
        };
    } catch (error) {
        return {
            type: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Refresh an access token using a refresh token.
 */
export async function refreshAccessToken(
    refreshToken: string
): Promise<{ accessToken: string; expiresAt: number } | { error: string }> {
    try {
        const startTime = Date.now();

        const response = await fetchWithTimeout(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: ANTIGRAVITY_CLIENT_ID,
                client_secret: ANTIGRAVITY_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { error: errorText };
        }

        const tokenPayload = (await response.json()) as GoogleTokenResponse;

        return {
            accessToken: tokenPayload.access_token,
            expiresAt: calculateTokenExpiry(startTime, tokenPayload.expires_in),
        };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
