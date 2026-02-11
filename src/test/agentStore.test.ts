import { describe, it, expect, beforeEach } from 'vitest';
import { useAgentStore } from '@/store/agentStore';

describe('Agent Store', () => {
    beforeEach(() => {
        // Reset the store before each test
        const store = useAgentStore.getState();
        useAgentStore.setState({
            agents: [],
            pipelines: [],
            conversations: [],
        });
    });

    describe('Agents CRUD', () => {
        it('should add a new agent', () => {
            const store = useAgentStore.getState();
            const agent = store.addAgent({
                name: 'Test Agent',
                description: 'A test agent',
                systemPrompt: 'You are a test agent',
                modelProvider: 'openai',
                modelId: 'gpt-4',
                avatarUrl: '',
            });

            expect(agent).toBeDefined();
            expect(agent.id).toBeDefined();
            expect(agent.name).toBe('Test Agent');
            expect(agent.createdAt).toBeDefined();
            expect(agent.updatedAt).toBeDefined();

            const agents = useAgentStore.getState().agents;
            expect(agents).toHaveLength(1);
            expect(agents[0].name).toBe('Test Agent');
        });

        it('should get agent by id', () => {
            const store = useAgentStore.getState();
            const agent = store.addAgent({
                name: 'Find Me',
                description: 'Agent to find',
                systemPrompt: 'prompt',
                modelProvider: 'googleai',
                modelId: 'gemini-2.5-flash',
            });

            const found = useAgentStore.getState().getAgent(agent.id);
            expect(found).toBeDefined();
            expect(found?.name).toBe('Find Me');
        });

        it('should return undefined for non-existent agent', () => {
            const store = useAgentStore.getState();
            const found = store.getAgent('non-existent-id');
            expect(found).toBeUndefined();
        });

        it('should update an agent', () => {
            const store = useAgentStore.getState();
            const agent = store.addAgent({
                name: 'Original Name',
                description: 'Original description',
                systemPrompt: 'prompt',
                modelProvider: 'openai',
                modelId: 'gpt-4',
            });

            useAgentStore.getState().updateAgent(agent.id, {
                name: 'Updated Name',
                description: 'Updated description',
            });

            const updated = useAgentStore.getState().getAgent(agent.id);
            expect(updated?.name).toBe('Updated Name');
            expect(updated?.description).toBe('Updated description');
            expect(updated?.updatedAt).not.toBe(agent.updatedAt);
        });

        it('should delete an agent', () => {
            const store = useAgentStore.getState();
            const agent = store.addAgent({
                name: 'To Delete',
                description: 'Will be deleted',
                systemPrompt: 'prompt',
                modelProvider: 'anthropic',
                modelId: 'claude-3.5-sonnet',
            });

            expect(useAgentStore.getState().agents).toHaveLength(1);
            useAgentStore.getState().deleteAgent(agent.id);
            expect(useAgentStore.getState().agents).toHaveLength(0);
        });

        it('should handle multiple agents', () => {
            const store = useAgentStore.getState();
            store.addAgent({
                name: 'Agent 1',
                systemPrompt: 'prompt1',
                modelProvider: 'openai',
                modelId: 'gpt-4',
            });
            store.addAgent({
                name: 'Agent 2',
                systemPrompt: 'prompt2',
                modelProvider: 'googleai',
                modelId: 'gemini-2.5-pro',
            });
            store.addAgent({
                name: 'Agent 3',
                systemPrompt: 'prompt3',
                modelProvider: 'anthropic',
                modelId: 'claude-3.5-sonnet',
            });

            // Need to re-read state since addAgent doesn't return the latest state
            const agents = useAgentStore.getState().agents;
            expect(agents).toHaveLength(3);
        });
    });

    describe('Pipelines CRUD', () => {
        it('should add a pipeline', () => {
            const store = useAgentStore.getState();
            const pipeline = store.addPipeline({
                name: 'Test Pipeline',
                description: 'A test pipeline',
                nodes: [],
                edges: [],
            });

            expect(pipeline).toBeDefined();
            expect(pipeline.id).toBeDefined();
            expect(pipeline.name).toBe('Test Pipeline');
            expect(useAgentStore.getState().pipelines).toHaveLength(1);
        });

        it('should update a pipeline', () => {
            const store = useAgentStore.getState();
            const pipeline = store.addPipeline({
                name: 'Original Pipeline',
                nodes: [],
                edges: [],
            });

            useAgentStore.getState().updatePipeline(pipeline.id, {
                name: 'Updated Pipeline',
            });

            const updated = useAgentStore.getState().pipelines.find(p => p.id === pipeline.id);
            expect(updated?.name).toBe('Updated Pipeline');
        });

        it('should delete a pipeline', () => {
            const store = useAgentStore.getState();
            const pipeline = store.addPipeline({
                name: 'To Delete',
                nodes: [],
                edges: [],
            });

            expect(useAgentStore.getState().pipelines).toHaveLength(1);
            useAgentStore.getState().deletePipeline(pipeline.id);
            expect(useAgentStore.getState().pipelines).toHaveLength(0);
        });
    });

    describe('Conversations', () => {
        it('should add a conversation', () => {
            const store = useAgentStore.getState();
            const agent = store.addAgent({
                name: 'Chat Agent',
                systemPrompt: 'prompt',
                modelProvider: 'openai',
                modelId: 'gpt-4',
            });

            const conv = useAgentStore.getState().addConversation(agent.id, 'Test Chat');
            expect(conv).toBeDefined();
            expect(conv.id).toBeDefined();
            expect(conv.agentId).toBe(agent.id);
            expect(conv.title).toBe('Test Chat');
            expect(conv.messages).toHaveLength(0);
        });

        it('should add messages to a conversation', () => {
            const store = useAgentStore.getState();
            const agent = store.addAgent({
                name: 'Chat Agent',
                systemPrompt: 'prompt',
                modelProvider: 'openai',
                modelId: 'gpt-4',
            });

            const conv = useAgentStore.getState().addConversation(agent.id, 'Test Chat');

            useAgentStore.getState().addMessage(conv.id, {
                role: 'user',
                content: 'Hello!',
            });

            useAgentStore.getState().addMessage(conv.id, {
                role: 'assistant',
                content: 'Hi! How can I help you?',
                agentId: agent.id,
            });

            const updatedConv = useAgentStore.getState().conversations.find(c => c.id === conv.id);
            expect(updatedConv?.messages).toHaveLength(2);
            expect(updatedConv?.messages[0].role).toBe('user');
            expect(updatedConv?.messages[0].content).toBe('Hello!');
            expect(updatedConv?.messages[1].role).toBe('assistant');
            expect(updatedConv?.messages[1].content).toBe('Hi! How can I help you?');
        });

        it('should delete a conversation', () => {
            const store = useAgentStore.getState();
            const agent = store.addAgent({
                name: 'Agent',
                systemPrompt: 'prompt',
                modelProvider: 'openai',
                modelId: 'gpt-4',
            });
            const conv = useAgentStore.getState().addConversation(agent.id, 'To Delete');

            expect(useAgentStore.getState().conversations).toHaveLength(1);
            useAgentStore.getState().deleteConversation(conv.id);
            expect(useAgentStore.getState().conversations).toHaveLength(0);
        });
    });
});
