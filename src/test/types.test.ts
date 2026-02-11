import { describe, it, expect } from 'vitest';
import { AI_PROVIDERS, AI_MODELS } from '@/types';

describe('Types and Constants', () => {
    describe('AI_PROVIDERS', () => {
        it('should have 4 providers', () => {
            expect(AI_PROVIDERS).toHaveLength(4);
        });

        it('should include all expected providers', () => {
            const providerIds = AI_PROVIDERS.map(p => p.id);
            expect(providerIds).toContain('googleai');
            expect(providerIds).toContain('openai');
            expect(providerIds).toContain('anthropic');
            expect(providerIds).toContain('mistral');
        });

        it('each provider should have id, name, and icon', () => {
            for (const provider of AI_PROVIDERS) {
                expect(provider.id).toBeDefined();
                expect(provider.name).toBeDefined();
                expect(provider.icon).toBeDefined();
                expect(typeof provider.id).toBe('string');
                expect(typeof provider.name).toBe('string');
                expect(typeof provider.icon).toBe('string');
            }
        });
    });

    describe('AI_MODELS', () => {
        it('should have models for each provider', () => {
            for (const provider of AI_PROVIDERS) {
                expect(AI_MODELS[provider.id]).toBeDefined();
                expect(AI_MODELS[provider.id].length).toBeGreaterThan(0);
            }
        });

        it('Google AI should have Gemini models', () => {
            const googleModels = AI_MODELS.googleai;
            expect(googleModels.length).toBeGreaterThanOrEqual(3);
            const modelIds = googleModels.map(m => m.id);
            expect(modelIds).toContain('gemini-2.5-pro');
            expect(modelIds).toContain('gemini-2.5-flash');
        });

        it('OpenAI models should include GPT-4', () => {
            const openaiModels = AI_MODELS.openai;
            const modelIds = openaiModels.map(m => m.id);
            expect(modelIds).toContain('gpt-4');
        });

        it('Anthropic should have Claude models', () => {
            const anthropicModels = AI_MODELS.anthropic;
            const modelIds = anthropicModels.map(m => m.id);
            expect(modelIds).toContain('claude-3.5-sonnet');
        });

        it('each model should have id and name', () => {
            for (const providerId of Object.keys(AI_MODELS)) {
                for (const model of AI_MODELS[providerId]) {
                    expect(model.id).toBeDefined();
                    expect(model.name).toBeDefined();
                    expect(typeof model.id).toBe('string');
                    expect(typeof model.name).toBe('string');
                }
            }
        });
    });
});
