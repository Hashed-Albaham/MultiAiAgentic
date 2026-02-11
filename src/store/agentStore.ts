import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Agent, Pipeline, Conversation, ChatMessage } from '@/types';

function generateId() {
  return crypto.randomUUID();
}

interface AgentStore {
  agents: Agent[];
  pipelines: Pipeline[];
  conversations: Conversation[];
  
  // Agents
  addAgent: (agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => Agent;
  updateAgent: (id: string, data: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  getAgent: (id: string) => Agent | undefined;
  
  // Pipelines
  addPipeline: (pipeline: Omit<Pipeline, 'id' | 'createdAt' | 'updatedAt'>) => Pipeline;
  updatePipeline: (id: string, data: Partial<Pipeline>) => void;
  deletePipeline: (id: string) => void;
  
  // Conversations
  addConversation: (agentId: string, title: string) => Conversation;
  addMessage: (conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  deleteConversation: (id: string) => void;
}

const SAMPLE_AGENTS: Agent[] = [
  {
    id: '1',
    name: 'المساعد العام',
    description: 'وكيل ذكي للأسئلة العامة والمهام اليومية',
    systemPrompt: 'أنت مساعد ذكي محترف. أجب بوضوح ودقة باللغة العربية.',
    modelProvider: 'googleai',
    modelId: 'gemini-2.5-flash',
    avatarUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'مطور البرمجيات',
    description: 'متخصص في كتابة ومراجعة الأكواد البرمجية',
    systemPrompt: 'أنت مطور برمجيات خبير. ساعد في كتابة أكواد نظيفة وفعالة.',
    modelProvider: 'openai',
    modelId: 'gpt-4',
    avatarUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'كاتب المحتوى',
    description: 'متخصص في كتابة المقالات والمحتوى الإبداعي',
    systemPrompt: 'أنت كاتب محتوى محترف. اكتب محتوى جذاب وعالي الجودة.',
    modelProvider: 'anthropic',
    modelId: 'claude-3.5-sonnet',
    avatarUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
      agents: SAMPLE_AGENTS,
      pipelines: [],
      conversations: [],

      addAgent: (data) => {
        const agent: Agent = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ agents: [...s.agents, agent] }));
        return agent;
      },
      updateAgent: (id, data) =>
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
          ),
        })),
      deleteAgent: (id) => set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),
      getAgent: (id) => get().agents.find((a) => a.id === id),

      addPipeline: (data) => {
        const pipeline: Pipeline = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ pipelines: [...s.pipelines, pipeline] }));
        return pipeline;
      },
      updatePipeline: (id, data) =>
        set((s) => ({
          pipelines: s.pipelines.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        })),
      deletePipeline: (id) => set((s) => ({ pipelines: s.pipelines.filter((p) => p.id !== id) })),

      addConversation: (agentId, title) => {
        const conv: Conversation = {
          id: generateId(),
          agentId,
          title,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ conversations: [...s.conversations, conv] }));
        return conv;
      },
      addMessage: (conversationId, message) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [
                    ...c.messages,
                    { ...message, id: generateId(), timestamp: new Date().toISOString() },
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
        })),
      deleteConversation: (id) =>
        set((s) => ({ conversations: s.conversations.filter((c) => c.id !== id) })),
    }),
    { name: 'wakil-plus-store' }
  )
);
