/**
 * Authentication and user types
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  pictureUrl?: string;
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  deviceId?: string;
  deviceName?: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiKeyConfig {
  id: string;
  provider: 'anthropic' | 'aws_bedrock';
  label?: string;
  keyPrefix?: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

export interface QuotaStatus {
  callsUsed: number;
  callsLimit: number;
  remaining: number;
  resetsAt?: string;
}

// ============================================================================
// Antigravity OAuth Types
// ============================================================================

/**
 * Stored Antigravity OAuth tokens
 */
export interface AntigravityTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  projectId: string;
  email?: string;
}

/**
 * Antigravity authenticated account
 */
export interface AntigravityAccount {
  id: string;
  email: string;
  projectId: string;
  createdAt: string;
  lastUsedAt?: string;
}

/**
 * Result of Antigravity login operation
 */
export interface AntigravityLoginResult {
  success: boolean;
  account?: AntigravityAccount;
  error?: string;
}

/**
 * Antigravity authentication status
 */
export interface AntigravityStatus {
  authenticated: boolean;
  accountCount: number;
}
