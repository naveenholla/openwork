export interface SelectedModel {
  provider: string;
  model: string;
}

export interface ModelConfig {
  id: string;
  displayName: string;
  provider: string;
  fullId: string;
  contextWindow?: number;
  supportsVision?: boolean;
}

export interface ProviderConfig {
  id: string;
  name: string;
  requiresApiKey: boolean;
  requiresOAuth?: boolean;
  apiKeyEnvVar?: string;
  baseUrl?: string;
  models: ModelConfig[];
}

export const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    requiresApiKey: true,
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    models: [
      // Standard Anthropic models (route to Anthropic API with real key)
      {
        id: 'claude-opus-4-5',
        displayName: 'Claude Opus 4.5',
        provider: 'anthropic',
        fullId: 'anthropic/claude-opus-4-5',
        contextWindow: 200000,
        supportsVision: true,
      },
      {
        id: 'claude-sonnet-4-5',
        displayName: 'Claude Sonnet 4.5',
        provider: 'anthropic',
        fullId: 'anthropic/claude-sonnet-4-5',
        contextWindow: 200000,
        supportsVision: true,
      },
      {
        id: 'claude-haiku-4-5',
        displayName: 'Claude Haiku 4.5',
        provider: 'anthropic',
        fullId: 'anthropic/claude-haiku-4-5',
        contextWindow: 200000,
        supportsVision: true,
      },
    ],
  },
  {
    id: 'google',
    name: 'Google AI',
    requiresApiKey: true,
    apiKeyEnvVar: 'GOOGLE_GENERATIVE_AI_API_KEY',
    models: [
      {
        id: 'gemini-2-flash',
        displayName: 'Gemini 2 Flash',
        provider: 'google',
        fullId: 'google/gemini-2-flash',
        contextWindow: 1000000,
        supportsVision: true,
      },
      {
        id: 'gemini-2-pro',
        displayName: 'Gemini 2 Pro',
        provider: 'google',
        fullId: 'google/gemini-2-pro',
        contextWindow: 2000000,
        supportsVision: true,
      },
      {
        id: 'gemini-3-flash-preview',
        displayName: 'Gemini 3 Flash (Preview)',
        provider: 'google',
        fullId: 'google/gemini-3-flash-preview',
        contextWindow: 1000000,
        supportsVision: true,
      },
      {
        id: 'gemini-3-pro-preview',
        displayName: 'Gemini 3 Pro (Preview)',
        provider: 'google',
        fullId: 'google/gemini-3-pro-preview',
        contextWindow: 2000000,
        supportsVision: true,
      },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    requiresApiKey: true,
    apiKeyEnvVar: 'GROQ_API_KEY',
    models: [
      {
        id: 'llama-3-70b',
        displayName: 'Llama 3 70B',
        provider: 'groq',
        fullId: 'groq/llama-3-70b',
        contextWindow: 8192,
        supportsVision: false,
      },
    ],
  },
  {
    id: 'local',
    name: 'Local Models (Ollama)',
    requiresApiKey: false,
    models: [
      {
        id: 'ollama',
        displayName: 'Ollama (Local)',
        provider: 'local',
        fullId: 'ollama/llama3',
        supportsVision: false,
      },
    ],
  },
  {
    id: 'vibeproxy-google',
    name: 'VibeProxy Google',
    requiresApiKey: false,
    baseUrl: 'http://localhost:8317/v1beta',
    models: [
      { id: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash (Proxy)', provider: 'vibeproxy-google', fullId: 'vibeproxy-google/gemini-2.5-flash', contextWindow: 1000000, supportsVision: true },
      { id: 'gemini-2.5-flash-lite', displayName: 'Gemini 2.5 Flash Lite (Proxy)', provider: 'vibeproxy-google', fullId: 'vibeproxy-google/gemini-2.5-flash-lite', contextWindow: 1000000, supportsVision: true },
      { id: 'gemini-2.5-computer-use-preview-10-2025', displayName: 'Gemini 2.5 Computer Use (Proxy)', provider: 'vibeproxy-google', fullId: 'vibeproxy-google/gemini-2.5-computer-use-preview-10-2025', contextWindow: 1000000, supportsVision: true },
      { id: 'gemini-3-flash-preview', displayName: 'Gemini 3 Flash Preview (Proxy)', provider: 'vibeproxy-google', fullId: 'vibeproxy-google/gemini-3-flash-preview', contextWindow: 1000000, supportsVision: true },
      { id: 'gemini-3-pro-preview', displayName: 'Gemini 3 Pro Preview (Proxy)', provider: 'vibeproxy-google', fullId: 'vibeproxy-google/gemini-3-pro-preview', contextWindow: 2000000, supportsVision: true },
      { id: 'gemini-3-pro-image-preview', displayName: 'Gemini 3 Pro Image (Proxy)', provider: 'vibeproxy-google', fullId: 'vibeproxy-google/gemini-3-pro-image-preview', contextWindow: 2000000, supportsVision: true },
    ],
  },
  {
    id: 'vibeproxy-openai',
    name: 'VibeProxy OpenAI',
    requiresApiKey: false,
    baseUrl: 'http://localhost:8317/v1',
    models: [
      { id: 'gpt-5-codex-mini', displayName: 'GPT 5 Codex Mini (Proxy)', provider: 'vibeproxy-openai', fullId: 'vibeproxy-openai/gpt-5-codex-mini', contextWindow: 128000, supportsVision: false },
      { id: 'gpt-5.1-codex-max', displayName: 'GPT 5.1 Codex Max (Proxy)', provider: 'vibeproxy-openai', fullId: 'vibeproxy-openai/gpt-5.1-codex-max', contextWindow: 128000, supportsVision: false },
      { id: 'gpt-5.2-codex', displayName: 'GPT 5.2 Codex (Proxy)', provider: 'vibeproxy-openai', fullId: 'vibeproxy-openai/gpt-5.2-codex', contextWindow: 128000, supportsVision: false },
    ],
  },
  {
    id: 'vibeproxy-anthropic',
    name: 'VibeProxy Anthropic',
    requiresApiKey: false,
    baseUrl: 'http://localhost:8317/v1',
    models: [
      { id: 'gemini-claude-opus-4-5-thinking', displayName: 'Gemini Claude Opus 4.5 Thinking (Proxy)', provider: 'vibeproxy-anthropic', fullId: 'vibeproxy-anthropic/gemini-claude-opus-4-5-thinking', contextWindow: 128000, supportsVision: true },
      { id: 'gemini-claude-sonnet-4-5', displayName: 'Gemini Claude Sonnet 4.5 (Proxy)', provider: 'vibeproxy-anthropic', fullId: 'vibeproxy-anthropic/gemini-claude-sonnet-4-5', contextWindow: 128000, supportsVision: true },
      { id: 'gemini-claude-sonnet-4-5-thinking', displayName: 'Gemini Claude Sonnet 4.5 Thinking (Proxy)', provider: 'vibeproxy-anthropic', fullId: 'vibeproxy-anthropic/gemini-claude-sonnet-4-5-thinking', contextWindow: 128000, supportsVision: true },
    ],
  },
];

/**
 * Antigravity provider - deprecated, models moved to Anthropic provider
 * Keeping for backward compatibility with stored model selections
 */
export const ANTIGRAVITY_PROVIDER: ProviderConfig = {
  id: 'antigravity',
  name: 'Antigravity (Local Proxy)',
  requiresApiKey: false,
  requiresOAuth: false,
  baseUrl: 'http://localhost:8317/v1',
  models: [],
};

export const DEFAULT_MODEL: SelectedModel = {
  provider: 'anthropic',
  model: 'anthropic/claude-opus-4-5',
};

/**
 * List of standard Anthropic model IDs that route to real Anthropic API
 * All other anthropic/* models route to local proxy
 */
export const STANDARD_ANTHROPIC_MODELS = [
  'claude-opus-4-5',
  'claude-sonnet-4-5',
  'claude-haiku-4-5',
];
