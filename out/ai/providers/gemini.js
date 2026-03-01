"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const aiProvider_1 = require("../aiProvider");
const promptBuilder_1 = require("../promptBuilder");
const responseParser_1 = require("../responseParser");
const logger_1 = require("../../utils/logger");
class GeminiProvider extends aiProvider_1.AIProvider {
    constructor(config) {
        super(config);
        this.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';
        logger_1.Logger.info('GeminiProvider initialized', { model: config.model });
    }
    async analyzeChanges(changes) {
        logger_1.Logger.info('GeminiProvider: Analyzing changes', { fileCount: changes.length });
        const prompt = promptBuilder_1.PromptBuilder.buildGroupingPrompt(changes);
        const response = await this.makeRequest(prompt);
        const content = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return responseParser_1.ResponseParser.parseGroupingResponse(content, changes);
    }
    async generateCommitMessage(files) {
        logger_1.Logger.info('GeminiProvider: Generating commit message', { fileCount: files.length });
        const prompt = promptBuilder_1.PromptBuilder.buildMessagePrompt(files);
        const response = await this.makeRequest(prompt);
        const content = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return responseParser_1.ResponseParser.parseMessageResponse(content);
    }
    async validateApiKey() {
        try {
            logger_1.Logger.info('GeminiProvider: Validating API key');
            await axios_1.default.get(`${this.endpoint}?key=${this.config.apiKey}`, { timeout: 5000 });
            return true;
        }
        catch (error) {
            logger_1.Logger.error('GeminiProvider: API key validation failed', error);
            return false;
        }
    }
    async makeRequest(prompt) {
        try {
            const model = this.config.model || 'gemini-2.0-flash';
            const url = `${this.endpoint}/${model}:generateContent?key=${this.config.apiKey}`;
            logger_1.Logger.debug('GeminiProvider: Making API request', { model, promptLength: prompt.length });
            const response = await axios_1.default.post(url, {
                contents: [
                    {
                        parts: [
                            {
                                text: `You are an expert at analyzing code changes and organizing them into logical commits. Respond with valid JSON only.\n\n${prompt}`
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: this.config.temperature || 0.3,
                    maxOutputTokens: this.config.maxTokens || 2000,
                    responseMimeType: 'application/json',
                }
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });
            logger_1.Logger.debug('GeminiProvider: API response received', { status: response.status });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                logger_1.Logger.error('GeminiProvider: API request failed', {
                    status: error.response?.status,
                    data: error.response?.data,
                });
                throw new Error(`Gemini API Error: ${error.response?.data?.error?.message || error.message}`);
            }
            throw error;
        }
    }
}
exports.GeminiProvider = GeminiProvider;
//# sourceMappingURL=gemini.js.map