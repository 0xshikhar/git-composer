import axios from 'axios';
import { AIAnalyzeOptions, AIProvider, AIProviderConfig, AIResponse } from '../aiProvider';
import { FileChange } from '../../types/git';
import { PromptBuilder } from '../promptBuilder';
import { ResponseParser } from '../responseParser';
import { Logger } from '../../utils/logger';

export class GeminiProvider extends AIProvider {
    private readonly endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';

    constructor(config: AIProviderConfig) {
        super(config);
        Logger.info('GeminiProvider initialized', { model: config.model });
    }

    async analyzeChanges(changes: FileChange[], options?: AIAnalyzeOptions): Promise<AIResponse> {
        Logger.info('GeminiProvider: Analyzing changes', { fileCount: changes.length });
        const prompt = PromptBuilder.buildGroupingPrompt(changes, options);
        const response = await this.makeRequest(prompt);

        const content = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return ResponseParser.parseGroupingResponse(content, changes);
    }

    async generateCommitMessage(files: FileChange[]): Promise<string> {
        Logger.info('GeminiProvider: Generating commit message', { fileCount: files.length });
        const prompt = PromptBuilder.buildMessagePrompt(files);
        const response = await this.makeRequest(prompt);

        const content = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return ResponseParser.parseMessageResponse(content);
    }

    async validateApiKey(): Promise<boolean> {
        try {
            Logger.info('GeminiProvider: Validating API key');
            await axios.get(
                `${this.endpoint}?key=${this.config.apiKey}`,
                { timeout: 5000 }
            );
            return true;
        } catch (error) {
            Logger.error('GeminiProvider: API key validation failed', error);
            return false;
        }
    }

    protected async makeRequest(prompt: string): Promise<any> {
        try {
            const model = this.config.model || 'gemini-2.0-flash';
            const url = `${this.endpoint}/${model}:generateContent?key=${this.config.apiKey}`;

            Logger.debug('GeminiProvider: Making API request', { model, promptLength: prompt.length });

            const response = await axios.post(
                url,
                {
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
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                }
            );

            Logger.debug('GeminiProvider: API response received', { status: response.status });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                Logger.error('GeminiProvider: API request failed', {
                    status: error.response?.status,
                    data: error.response?.data,
                });
                throw new Error(
                    `Gemini API Error: ${error.response?.data?.error?.message || error.message}`
                );
            }
            throw error;
        }
    }
}
