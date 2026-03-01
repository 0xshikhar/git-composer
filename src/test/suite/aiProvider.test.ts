import * as assert from 'assert';
import { AIProviderFactory } from '../../ai/aiProviderFactory';
import { ChangeType, FileChange } from '../../types/git';
import { OpenAIProvider } from '../../ai/providers/openai';

suite('AI Provider Factory Test Suite', () => {
    test('should create OpenAI provider by default', () => {
        const provider = AIProviderFactory.create('openai', { apiKey: 'test', model: 'gpt-4o' });
        assert.ok(provider instanceof OpenAIProvider);
    });

    test('should fallback to OpenAI for unknown provider', () => {
        assert.throws(
            () => AIProviderFactory.create('unknown', { apiKey: 'test', model: 'gpt-4o' }),
            /Unknown AI provider/
        );
    });
});
