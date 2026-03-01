"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const aiProvider_1 = require("../aiProvider");
const promptBuilder_1 = require("../promptBuilder");
const responseParser_1 = require("../responseParser");
const logger_1 = require("../../utils/logger");
/**
 * Ollama provider — local model inference via REST API.
 */
class OllamaProvider extends aiProvider_1.AIProvider {
    constructor(config) {
        super(config);
        this.baseUrl = config.baseUrl || 'http://localhost:11434';
        logger_1.Logger.info('OllamaProvider initialized', { model: config.model, baseUrl: this.baseUrl });
    }
    async analyzeChanges(changes) {
        logger_1.Logger.info('OllamaProvider: Analyzing changes', { fileCount: changes.length });
        const prompt = promptBuilder_1.PromptBuilder.buildGroupingPrompt(changes);
        const response = await this.makeRequest(prompt);
        const content = response.message?.content || response.response || '';
        return responseParser_1.ResponseParser.parseGroupingResponse(content, changes);
    }
    async generateCommitMessage(files) {
        logger_1.Logger.info('OllamaProvider: Generating commit message', { fileCount: files.length });
        const prompt = promptBuilder_1.PromptBuilder.buildMessagePrompt(files);
        const response = await this.makeRequest(prompt);
        const content = response.message?.content || response.response || '';
        return responseParser_1.ResponseParser.parseMessageResponse(content);
    }
    async validateApiKey() {
        try {
            logger_1.Logger.info('OllamaProvider: Checking server availability');
            await axios_1.default.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
            return true;
        }
        catch (error) {
            logger_1.Logger.error('OllamaProvider: Server not reachable', error);
            return false;
        }
    }
    async makeRequest(prompt) {
        try {
            const model = this.config.model || 'llama3.2';
            logger_1.Logger.debug('OllamaProvider: Making API request', { model, promptLength: prompt.length });
            const response = await axios_1.default.post(`${this.baseUrl}/api/chat`, {
                model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert at analyzing code changes and organizing them into logical commits. Respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                stream: false,
                options: {
                    temperature: this.config.temperature || 0.3,
                    num_predict: this.config.maxTokens || 2000,
                },
                format: 'json',
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 120000 // local models can be slow
            });
            logger_1.Logger.debug('OllamaProvider: API response received', { status: response.status });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                logger_1.Logger.error('OllamaProvider: API request failed', {
                    status: error.response?.status,
                    data: error.response?.data,
                });
                throw new Error(`Ollama Error: ${error.response?.data?.error || error.message}`);
            }
            throw error;
        }
    }
}
exports.OllamaProvider = OllamaProvider;
//# sourceMappingURL=ollama.js.map