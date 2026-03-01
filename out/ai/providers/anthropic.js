"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const aiProvider_1 = require("../aiProvider");
const promptBuilder_1 = require("../promptBuilder");
const responseParser_1 = require("../responseParser");
class AnthropicProvider extends aiProvider_1.AIProvider {
    constructor() {
        super(...arguments);
        this.endpoint = 'https://api.anthropic.com/v1/messages';
    }
    async analyzeChanges(changes) {
        const prompt = promptBuilder_1.PromptBuilder.buildGroupingPrompt(changes);
        const response = await this.makeRequest(prompt);
        return responseParser_1.ResponseParser.parseGroupingResponse(response.content[0].text, changes);
    }
    async generateCommitMessage(files) {
        const prompt = promptBuilder_1.PromptBuilder.buildMessagePrompt(files);
        const response = await this.makeRequest(prompt);
        return responseParser_1.ResponseParser.parseMessageResponse(response.content[0].text);
    }
    async validateApiKey() {
        try {
            // Simple validation by making a small request
            // Note: Anthropic doesn't have a simple 'validate' endpoint like OpenAI's /models that is cheap/free always, 
            // but we can try a minimal request or just assume valid if structure is correct.
            // For now, let's try a minimal request.
            await this.makeRequest('Test');
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async makeRequest(prompt) {
        try {
            const response = await axios_1.default.post(this.endpoint, {
                model: this.config.model || 'claude-3-sonnet-20240229',
                max_tokens: this.config.maxTokens || 2000,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: this.config.temperature || 0.3
            }, {
                headers: {
                    'x-api-key': this.config.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Anthropic API Error: ${error.response?.data?.error?.message || error.message}`);
            }
            throw error;
        }
    }
}
exports.AnthropicProvider = AnthropicProvider;
//# sourceMappingURL=anthropic.js.map