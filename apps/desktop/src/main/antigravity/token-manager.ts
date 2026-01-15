/**
 * Token manager for Antigravity OAuth tokens.
 * Handles token storage, retrieval, refresh, and multi-account management.
 */

import { shell } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import { homedir } from 'os';
import {
    storeAntigravityTokens,
    getAntigravityTokens,
    deleteAntigravityTokens,
    listAntigravityAccounts,
    type AntigravityStoredTokens,
} from '../store/secureStorage';
import {
    buildAuthorizationUrl,
    exchangeCodeForTokens,
    refreshAccessToken,
    type TokenExchangeSuccess,
} from './oauth';
import {
    startOAuthServer,
    stopOAuthServer,
    waitForOAuthCallback,
    isOAuthServerRunning,
} from './server';
import { TOKEN_REFRESH_BUFFER_MS, ANTIGRAVITY_DEFAULT_PROJECT_ID } from './constants';

/**
 * Get the path to OpenCode's antigravity accounts storage file.
 * This is where the opencode-antigravity-auth plugin stores accounts.
 */
function getOpenCodeStoragePath(): string {
    const platform = process.platform;
    if (platform === 'win32') {
        return path.join(process.env.APPDATA || path.join(homedir(), 'AppData', 'Roaming'), 'opencode', 'antigravity-accounts.json');
    }
    const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(homedir(), '.config');
    return path.join(xdgConfig, 'opencode', 'antigravity-accounts.json');
}

/**
 * Sync our stored tokens to OpenCode's plugin storage format.
 * This allows the opencode-antigravity-auth plugin to use our tokens.
 */
async function syncToOpenCodePlugin(): Promise<void> {
    try {
        const accountIds = listAntigravityAccounts();
        const accounts: Array<{
            email?: string;
            refreshToken: string;
            projectId?: string;
            addedAt: number;
            lastUsed: number;
        }> = [];

        for (const accountId of accountIds) {
            const tokens = getAntigravityTokens(accountId);
            if (tokens?.refreshToken) {
                accounts.push({
                    email: tokens.email,
                    refreshToken: tokens.refreshToken,
                    projectId: tokens.projectId,
                    addedAt: new Date(tokens.createdAt).getTime(),
                    lastUsed: new Date(tokens.lastUsedAt || tokens.createdAt).getTime(),
                });
            }
        }

        if (accounts.length === 0) {
            // No accounts, try to delete the file if it exists
            try {
                await fs.unlink(getOpenCodeStoragePath());
            } catch {
                // Ignore if file doesn't exist
            }
            return;
        }

        const storage = {
            version: 3,
            accounts,
            activeIndex: 0,
        };

        // Ensure directory exists
        const storagePath = getOpenCodeStoragePath();
        await fs.mkdir(path.dirname(storagePath), { recursive: true });

        // Write the file
        await fs.writeFile(storagePath, JSON.stringify(storage, null, 2), 'utf-8');
        console.log(`[Antigravity] Synced ${accounts.length} account(s) to OpenCode plugin storage`);
    } catch (error) {
        console.error('[Antigravity] Failed to sync to OpenCode plugin:', error);
    }
}

/**
 * Antigravity account info returned to callers.
 */
export interface AntigravityAccount {
    id: string;
    email: string;
    projectId: string;
    createdAt: string;
    lastUsedAt?: string;
}

/**
 * Result of login operation.
 */
export interface LoginResult {
    success: boolean;
    account?: AntigravityAccount;
    error?: string;
}

/**
 * Generate a unique account ID.
 */
function generateAccountId(): string {
    return `account_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Initiate OAuth login flow.
 * Opens the browser for Google authentication and waits for callback.
 */
export async function login(): Promise<LoginResult> {
    try {
        // Start OAuth server if not running
        const serverStarted = await startOAuthServer();
        if (!serverStarted) {
            return {
                success: false,
                error: 'Failed to start OAuth callback server. Port may be in use.',
            };
        }

        // Build authorization URL
        const auth = buildAuthorizationUrl();

        // Open browser for authentication
        await shell.openExternal(auth.url);

        // Wait for OAuth callback
        const callback = await waitForOAuthCallback(auth.state);

        // Exchange code for tokens
        const result = await exchangeCodeForTokens(callback.code, callback.state);

        if (result.type === 'failed') {
            return {
                success: false,
                error: result.error,
            };
        }

        // Generate account ID and save tokens
        const accountId = generateAccountId();
        const now = new Date().toISOString();

        const tokens: AntigravityStoredTokens = {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            expiresAt: result.expiresAt,
            projectId: result.projectId || ANTIGRAVITY_DEFAULT_PROJECT_ID,
            email: result.email,
            createdAt: now,
            lastUsedAt: now,
        };

        storeAntigravityTokens(accountId, tokens);

        // Sync to OpenCode plugin storage
        await syncToOpenCodePlugin();

        const account: AntigravityAccount = {
            id: accountId,
            email: result.email || 'Unknown',
            projectId: tokens.projectId,
            createdAt: now,
            lastUsedAt: now,
        };

        console.log(`[Antigravity] Successfully logged in as ${account.email}`);

        return {
            success: true,
            account,
        };
    } catch (error) {
        console.error('[Antigravity] Login failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Logout and remove stored tokens for an account.
 */
export async function logout(accountId: string): Promise<boolean> {
    const deleted = deleteAntigravityTokens(accountId);
    if (deleted) {
        console.log(`[Antigravity] Logged out account ${accountId}`);
        await syncToOpenCodePlugin();
    }
    return deleted;
}

/**
 * Logout all accounts.
 */
export async function logoutAll(): Promise<number> {
    const accounts = listAntigravityAccounts();
    let count = 0;

    for (const accountId of accounts) {
        if (deleteAntigravityTokens(accountId)) {
            count++;
        }
    }

    if (count > 0) {
        await syncToOpenCodePlugin();
    }

    console.log(`[Antigravity] Logged out ${count} accounts`);
    return count;
}

/**
 * Get all authenticated accounts.
 */
export function getAccounts(): AntigravityAccount[] {
    const accountIds = listAntigravityAccounts();
    const accounts: AntigravityAccount[] = [];

    for (const accountId of accountIds) {
        const tokens = getAntigravityTokens(accountId);
        if (tokens) {
            accounts.push({
                id: accountId,
                email: tokens.email || 'Unknown',
                projectId: tokens.projectId,
                createdAt: tokens.createdAt,
                lastUsedAt: tokens.lastUsedAt,
            });
        }
    }

    return accounts;
}

/**
 * Check if any accounts are authenticated.
 */
export function isAuthenticated(): boolean {
    const accounts = listAntigravityAccounts();
    return accounts.length > 0;
}

/**
 * Get a valid access token for an account, refreshing if necessary.
 */
export async function getValidAccessToken(
    accountId: string
): Promise<{ token: string; projectId: string } | null> {
    const tokens = getAntigravityTokens(accountId);
    if (!tokens) {
        return null;
    }

    const now = Date.now();

    // Check if token needs refresh
    if (tokens.expiresAt - now <= TOKEN_REFRESH_BUFFER_MS) {
        console.log(`[Antigravity] Refreshing token for account ${accountId}`);

        const refreshResult = await refreshAccessToken(tokens.refreshToken);

        if ('error' in refreshResult) {
            console.error(`[Antigravity] Token refresh failed for ${accountId}:`, refreshResult.error);
            return null;
        }

        // Update stored tokens
        const updatedTokens: AntigravityStoredTokens = {
            ...tokens,
            accessToken: refreshResult.accessToken,
            expiresAt: refreshResult.expiresAt,
            lastUsedAt: new Date().toISOString(),
        };

        storeAntigravityTokens(accountId, updatedTokens);

        return {
            token: refreshResult.accessToken,
            projectId: tokens.projectId,
        };
    }

    // Update last used time
    storeAntigravityTokens(accountId, {
        ...tokens,
        lastUsedAt: new Date().toISOString(),
    });

    return {
        token: tokens.accessToken,
        projectId: tokens.projectId,
    };
}

/**
 * Get a valid access token from any authenticated account.
 * Rotates through accounts if one is rate-limited.
 */
export async function getAnyValidAccessToken(): Promise<{
    accountId: string;
    token: string;
    projectId: string;
} | null> {
    const accountIds = listAntigravityAccounts();

    for (const accountId of accountIds) {
        const result = await getValidAccessToken(accountId);
        if (result) {
            return {
                accountId,
                ...result,
            };
        }
    }

    return null;
}

/**
 * Stop the OAuth server (cleanup on app quit).
 */
export function cleanup(): void {
    stopOAuthServer();
}
