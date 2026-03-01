"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const aiProvider_1 = require("../aiProvider");
const promptBuilder_1 = require("../promptBuilder");
const responseParser_1 = require("../responseParser");
const logger_1 = require("../../utils/logger");
class OpenAIProvider extends aiProvider_1.AIProvider {
    constructor(config) {
        super(config);
        this.endpoint = 'https://api.openai.com/v1/chat/completions';
        logger_1.Logger.info('OpenAIProvider initialized', { model: config.model });
    }
    async analyzeChanges(changes) {
        logger_1.Logger.info('OpenAIProvider: Analyzing changes', { fileCount: changes.length });
        const prompt = promptBuilder_1.PromptBuilder.buildGroupingPrompt(changes);
        logger_1.Logger.debug('OpenAIProvider: Built prompt', { promptLength: prompt.length });
        const response = await this.makeRequest(prompt);
        // OpenAI's chat completion format
        const content = response.choices[0].message.content;
        return responseParser_1.ResponseParser.parseGroupingResponse(content, changes);
    }
    async generateCommitMessage(files) {
        logger_1.Logger.info('OpenAIProvider: Generating commit message', { fileCount: files.length });
        const prompt = promptBuilder_1.PromptBuilder.buildMessagePrompt(files);
        const response = await this.makeRequest(prompt);
        return responseParser_1.ResponseParser.parseMessageResponse(response.choices[0].message.content);
    }
    async validateApiKey() {
        try {
            logger_1.Logger.info('OpenAIProvider: Validating API key');
            await axios_1.default.get('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                timeout: 5000
            });
            logger_1.Logger.info('OpenAIProvider: API key validation successful');
            return true;
        }
        catch (error) {
            logger_1.Logger.error('OpenAIProvider: API key validation failed', error);
            return false;
        }
    }
    async makeRequest(prompt) {
        try {
            const model = this.config.model || 'gpt-5-mini';
            logger_1.Logger.debug('OpenAIProvider: Making API request', {
                model,
                promptLength: prompt.length
            });
            const requestBody = {
                model: model,
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
            };
            logger_1.Logger.debug('OpenAIProvider: Request body', requestBody);
            const response = await axios_1.default.post(this.endpoint, requestBody, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            logger_1.Logger.debug('OpenAIProvider: API response received', {
                status: response.status,
                data: response.data
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                logger_1.Logger.error('OpenAIProvider: API request failed', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message
                });
                throw new Error(`OpenAI API Error: ${error.response?.data?.error?.message || error.message}`);
            }
            logger_1.Logger.error('OpenAIProvider: Unexpected error', error);
            throw error;
        }
    }
}
exports.OpenAIProvider = OpenAIProvider;
//# sourceMappingURL=openai.js.map