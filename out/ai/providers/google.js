"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const aiProvider_1 = require("../aiProvider");
const promptBuilder_1 = require("../promptBuilder");
const responseParser_1 = require("../responseParser");
const logger_1 = require("../../utils/logger");
class GoogleProvider extends aiProvider_1.AIProvider {
    constructor(config) {
        super(config);
        this.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';
        logger_1.Logger.info('GoogleProvider initialized', { model: config.model });
    }
    async analyzeChanges(changes) {
        logger_1.Logger.info('GoogleProvider: Analyzing changes', { fileCount: changes.length });
        const prompt = promptBuilder_1.PromptBuilder.buildGroupingPrompt(changes);
        logger_1.Logger.debug('GoogleProvider: Built prompt', { promptLength: prompt.length });
        const response = await this.makeRequest(prompt);
        return responseParser_1.ResponseParser.parseGroupingResponse(response.candidates[0].content.parts[0].text, changes);
    }
    async generateCommitMessage(files) {
        logger_1.Logger.info('GoogleProvider: Generating commit message', { fileCount: files.length });
        const prompt = promptBuilder_1.PromptBuilder.buildMessagePrompt(files);
        const response = await this.makeRequest(prompt);
        return responseParser_1.ResponseParser.parseMessageResponse(response.candidates[0].content.parts[0].text);
    }
    async validateApiKey() {
        try {
            logger_1.Logger.info('GoogleProvider: Validating API key');
            await this.makeRequest('Test');
            logger_1.Logger.info('GoogleProvider: API key validation successful');
            return true;
        }
        catch (error) {
            logger_1.Logger.error('GoogleProvider: API key validation failed', error);
            return false;
        }
    }
    async makeRequest(prompt) {
        try {
            const model = this.config.model || 'gemini-2.5-flash';
            const url = `${this.endpoint}/${model}:generateContent?key=${this.config.apiKey}`;
            logger_1.Logger.debug('GoogleProvider: Making API request', {
                model,
                endpoint: this.endpoint,
                promptLength: prompt.length
            });
            const requestBody = {
                contents: [{
                        parts: [{
                                text: prompt
                            }]
                    }],
                generationConfig: {
                    temperature: this.config.temperature || 0.3,
                    maxOutputTokens: this.config.maxTokens || 2000
                }
            };
            logger_1.Logger.debug('GoogleProvider: Request body', requestBody);
            const response = await axios_1.default.post(url, requestBody, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            logger_1.Logger.debug('GoogleProvider: API response received', {
                status: response.status,
                data: response.data
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                logger_1.Logger.error('GoogleProvider: API request failed', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message
                });
                throw new Error(`Google API Error: ${error.response?.data?.error?.message || error.message}`);
            }
            logger_1.Logger.error('GoogleProvider: Unexpected error', error);
            throw error;
        }
    }
}
exports.GoogleProvider = GoogleProvider;
//# sourceMappingURL=google.js.map