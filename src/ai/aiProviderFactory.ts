import { AIProvider, AIProviderConfig } from './aiProvider';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { GoogleProvider } from './providers/google';
import { GroqProvider } from './providers/groq';
import * as vscode from 'vscode'; // Keep if we need workspace config later

export class AIProviderFactory {
    static create(providerName: string, config: AIProviderConfig): AIProvider {
        switch (providerName) {
            case 'openai':
                return new OpenAIProvider(config);
            case 'anthropic':
                return new AnthropicProvider(config);
            case 'google':
                return new GoogleProvider(config);
            case 'groq':
                return new GroqProvider(config);
            default:
                throw new Error(`Unknown AI provider: ${providerName}`);
        }
    }
}
