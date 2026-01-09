import axios from 'axios';
import { AIProvider, AIProviderConfig, AIResponse } from '../aiProvider';
import { FileChange } from '../../types/git';
import { PromptBuilder } from '../promptBuilder';
import { ResponseParser } from '../responseParser';
import { Logger } from '../../utils/logger';

export class OpenAIProvider extends AIProvider {
    private readonly endpoint = 'https://api.openai.com/v1/chat/completions';

    constructor(config: AIProviderConfig) {
        super(config);
        Logger.info('OpenAIProvider initialized', { model: config.model });
    }

    async analyzeChanges(changes: FileChange[]): Promise<AIResponse> {
        Logger.info('OpenAIProvider: Analyzing changes', { fileCount: changes.length });
        const prompt = PromptBuilder.buildGroupingPrompt(changes);
        Logger.debug('OpenAIProvider: Built prompt', { promptLength: prompt.length });

        const response = await this.makeRequest(prompt);

        // OpenAI's chat completion format
        const content = response.choices[0].message.content;
        return ResponseParser.parseGroupingResponse(content, changes);
    }

    async generateCommitMessage(files: FileChange[]): Promise<string> {
        Logger.info('OpenAIProvider: Generating commit message', { fileCount: files.length });
        const prompt = PromptBuilder.buildMessagePrompt(files);

        const response = await this.makeRequest(prompt);

        return ResponseParser.parseMessageResponse(
            response.choices[0].message.content
        );
    }

    async validateApiKey(): Promise<boolean> {
        try {
            Logger.info('OpenAIProvider: Validating API key');
            await axios.get('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                timeout: 5000
            });
            Logger.info('OpenAIProvider: API key validation successful');
            return true;
        } catch (error) {
            Logger.error('OpenAIProvider: API key validation failed', error);
            return false;
        }
    }

    protected async makeRequest(prompt: string): Promise<any> {
        try {
            const model = this.config.model || 'gpt-5-mini';

            Logger.debug('OpenAIProvider: Making API request', {
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

            Logger.debug('OpenAIProvider: Request body', requestBody);

            const response = await axios.post(
                this.endpoint,
                requestBody,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            Logger.debug('OpenAIProvider: API response received', {
                status: response.status,
                data: response.data
            });

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                Logger.error('OpenAIProvider: API request failed', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message
                });
                throw new Error(
                    `OpenAI API Error: ${error.response?.data?.error?.message || error.message}`
                );
            }
            Logger.error('OpenAIProvider: Unexpected error', error);
            throw error;
        }
    }
}
