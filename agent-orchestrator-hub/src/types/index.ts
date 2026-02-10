export interface Agent {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  systemPrompt: string;
  modelProvider: string;
  modelId: string;
  apiKeyId?: string;
  modelConfig?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentId?: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  agentId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface PipelineNode {
  id: string;
  agentId: string;
  position: { x: number; y: number };
  config?: {
    timeout?: number;
    retries?: number;
    label?: string;
    provider?: string;
    icon?: string;
  };
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  condition?: {
    type: 'always' | 'conditional' | 'on_success' | 'on_error';
    expression?: string;
  };
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionTrace {
  nodeId: string;
  agentId: string;
  input: string;
  output: string;
  startTime: string;
  endTime: string;
  duration: number;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface Execution {
  id: string;
  pipelineId: string;
  input: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  trace?: ExecutionTrace[];
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export const AI_PROVIDERS = [
  { id: 'googleai', name: 'Google Gemini', icon: '✦' },
  { id: 'openai', name: 'OpenAI', icon: '◎' },
  { id: 'anthropic', name: 'Anthropic Claude', icon: '◆' },
  { id: 'mistral', name: 'Mistral AI', icon: '◇' },
] as const;

export const AI_MODELS: Record<string, { id: string; name: string }[]> = {
  googleai: [
    // === 2026 / Late 2025 (Preview & Cutting Edge) ===
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Preview) Cutting Edge' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview) Cutting Edge' },

    // === 2025 (Production Ready) ===
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro Production' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash Production' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite Production' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash Production' },

    // === Legacy / Stable (2024) ===
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro Legacy' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash Legacy' },
    { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro Legacy' },
  ],
  openai: [
    // === Reasoning & Advanced (o-series) ===
    { id: 'o1', name: 'OpenAI o1 Reasoning' },
    { id: 'o1-mini', name: 'OpenAI o1-mini Reasoning' },
    { id: 'o3-mini', name: 'OpenAI o3-mini Reasoning' },

    // === GPT-4.5 / 4.1 Series (2025/2026) ===
    { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview Series' },
    { id: 'gpt-4.5-preview-2025-02-27', name: 'GPT-4.5 (Feb 2026) Series' },

    // === Flagship (GPT-4o) ===
    { id: 'gpt-4o', name: 'GPT-4o Flagship' },
    { id: 'gpt-4o-mini', name: 'GPT-4o mini Flagship' },

    // === Legacy GPT-4 ===
    { id: 'gpt-4-turbo', name: 'GPT-4 Legacy Turbo' },
    { id: 'gpt-4', name: 'GPT-4 Legacy' },

    // === Classic ===
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Classic Turbo' },
  ],
  anthropic: [
    // === Claude 3.5 (2024/2025) ===
    { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },

    // === Claude 3 (Legacy) ===
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Legacy Opus' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Legacy Sonnet' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Legacy Haiku' },
  ],
  mistral: [
    // === Premier / Large ===
    { id: 'mistral-large-latest', name: 'Mistral Premier Large (Latest)' },
    { id: 'mistral-medium-latest', name: 'Mistral Premier Medium (Latest)' },
    { id: 'mistral-small-latest', name: 'Mistral Premier Small (Latest)' },

    // === Codestral ===
    { id: 'codestral-latest', name: 'Codestral ( LatestCode)' },
    { id: 'codestral-2501', name: 'Codestral (Code) 25.01' },

    // === Ministral (Edge/Efficient) ===
    { id: 'ministral-8b-latest', name: 'Ministral (Edge/Efficient) 8B' },
    { id: 'ministral-3b-latest', name: 'Ministral (Edge/Efficient) 3B' },

    // === Open Options ===
    { id: 'open-mixtral-8x22b', name: 'Mixtral Open Option 8x22B' },
    { id: 'open-mistral-7b', name: 'Mistral Open Option 7B' },
  ],
};
