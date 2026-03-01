"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KimiProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const aiProvider_1 = require("../aiProvider");
const promptBuilder_1 = require("../promptBuilder");
const responseParser_1 = require("../responseParser");
const logger_1 = require("../../utils/logger");
/**
 * Kimi (Moonshot) provider — uses OpenAI-compatible API format.
 */
class KimiProvider extends aiProvider_1.AIProvider {
    constructor(config) {
        super(config);
        this.endpoint = config.baseUrl || 'https://api.moonshot.cn/v1/chat/completions';
        logger_1.Logger.info('KimiProvider initialized', { model: config.model, endpoint: this.endpoint });
    }
    async analyzeChanges(changes) {
        logger_1.Logger.info('KimiProvider: Analyzing changes', { fileCount: changes.length });
        const prompt = promptBuilder_1.PromptBuilder.buildGroupingPrompt(changes);
        const response = await this.makeRequest(prompt);
        const content = response.choices[0].message.content;
        return responseParser_1.ResponseParser.parseGroupingResponse(content, changes);
    }
    async generateCommitMessage(files) {
        logger_1.Logger.info('KimiProvider: Generating commit message', { fileCount: files.length });
        const prompt = promptBuilder_1.PromptBuilder.buildMessagePrompt(files);
        const response = await this.makeRequest(prompt);
        return responseParser_1.ResponseParser.parseMessageResponse(response.choices[0].message.content);
    }
    async validateApiKey() {
        try {
            logger_1.Logger.info('KimiProvider: Validating API key');
            const baseUrl = this.config.baseUrl || 'https://api.moonshot.cn/v1';
            await axios_1.default.get(`${baseUrl}/models`, {
                headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
                timeout: 5000
            });
            return true;
        }
        catch (error) {
            logger_1.Logger.error('KimiProvider: API key validation failed', error);
            return false;
        }
    }
    async makeRequest(prompt) {
        try {
            const model = this.config.model || 'moonshot-v1-8k';
            logger_1.Logger.debug('KimiProvider: Making API request', { model, promptLength: prompt.length });
            const response = await axios_1.default.post(this.endpoint, {
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
                temperature: this.config.temperature || 0.3,
                max_tokens: this.config.maxTokens || 2000,
            }, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            logger_1.Logger.debug('KimiProvider: API response received', { status: response.status });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                logger_1.Logger.error('KimiProvider: API request failed', {
                    status: error.response?.status,
                    data: error.response?.data,
                });
                throw new Error(`Kimi API Error: ${error.response?.data?.error?.message || error.message}`);
            }
            throw error;
        }
    }
}
exports.KimiProvider = KimiProvider;
//# sourceMappingURL=kimi.js.map