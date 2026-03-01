"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const aiProvider_1 = require("../aiProvider");
const promptBuilder_1 = require("../promptBuilder");
const responseParser_1 = require("../responseParser");
class GroqProvider extends aiProvider_1.AIProvider {
    constructor(config) {
        super(config);
        this.endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    }
    async analyzeChanges(changes) {
        const prompt = promptBuilder_1.PromptBuilder.buildGroupingPrompt(changes);
        const response = await this.makeRequest(prompt);
        return responseParser_1.ResponseParser.parseGroupingResponse(response.choices[0].message.content, changes);
    }
    async generateCommitMessage(files) {
        const prompt = promptBuilder_1.PromptBuilder.buildMessagePrompt(files);
        const response = await this.makeRequest(prompt);
        return responseParser_1.ResponseParser.parseMessageResponse(response.choices[0].message.content);
    }
    async validateApiKey() {
        try {
            await axios_1.default.get('https://api.groq.com/openai/v1/models', {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                timeout: 5000
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async makeRequest(prompt) {
        try {
            const response = await axios_1.default.post(this.endpoint, {
                model: this.config.model || 'llama3-70b-8192',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert at analyzing code changes and organizing them into logical commits.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: this.config.temperature || 0.3,
                max_tokens: this.config.maxTokens || 2000,
                response_format: { type: 'json_object' }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Groq API Error: ${error.response?.data?.error?.message || error.message}`);
            }
            throw error;
        }
    }
}
exports.GroqProvider = GroqProvider;
//# sourceMappingURL=groq.js.map