"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProviderFactory = void 0;
const openai_1 = require("./providers/openai");
const anthropic_1 = require("./providers/anthropic");
const gemini_1 = require("./providers/gemini");
const kimi_1 = require("./providers/kimi");
const ollama_1 = require("./providers/ollama");
class AIProviderFactory {
    static create(providerName, config) {
        switch (providerName) {
            case 'openai':
                return new openai_1.OpenAIProvider(config);
            case 'anthropic':
                return new anthropic_1.AnthropicProvider(config);
            case 'gemini':
                return new gemini_1.GeminiProvider(config);
            case 'kimi':
                return new kimi_1.KimiProvider(config);
            case 'ollama':
                return new ollama_1.OllamaProvider(config);
            default:
                throw new Error(`Unknown AI provider: ${providerName}. Supported: openai, anthropic, gemini, kimi, ollama`);
        }
    }
    static getSupportedProviders() {
        return ['openai', 'anthropic', 'gemini', 'kimi', 'ollama'];
    }
    static getDefaultModel(providerName) {
        switch (providerName) {
            case 'openai': return 'gpt-4o';
            case 'anthropic': return 'claude-sonnet-4-20250514';
            case 'gemini': return 'gemini-2.0-flash';
            case 'kimi': return 'moonshot-v1-8k';
            case 'ollama': return 'llama3.2';
            default: return '';
        }
    }
}
exports.AIProviderFactory = AIProviderFactory;
//# sourceMappingURL=aiProviderFactory.js.map