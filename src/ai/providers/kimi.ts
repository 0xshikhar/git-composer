import axios from 'axios';
import { AIProvider, AIProviderConfig, AIResponse } from '../aiProvider';
import { FileChange } from '../../types/git';
import { PromptBuilder } from '../promptBuilder';
import { ResponseParser } from '../responseParser';
import { Logger } from '../../utils/logger';

/**
 * Kimi (Moonshot) provider — uses OpenAI-compatible API format.
 */
export class KimiProvider extends AIProvider {
    private readonly endpoint: string;

    constructor(config: AIProviderConfig) {
        super(config);
        this.endpoint = config.baseUrl || 'https://api.moonshot.cn/v1/chat/completions';
        Logger.info('KimiProvider initialized', { model: config.model, endpoint: this.endpoint });
    }

    async analyzeChanges(changes: FileChange[]): Promise<AIResponse> {
        Logger.info('KimiProvider: Analyzing changes', { fileCount: changes.length });
        const prompt = PromptBuilder.buildGroupingPrompt(changes);
        const response = await this.makeRequest(prompt);

        const content = response.choices[0].message.content;
        return ResponseParser.parseGroupingResponse(content, changes);
    }

    async generateCommitMessage(files: FileChange[]): Promise<string> {
        Logger.info('KimiProvider: Generating commit message', { fileCount: files.length });
        const prompt = PromptBuilder.buildMessagePrompt(files);
        const response = await this.makeRequest(prompt);

        return ResponseParser.parseMessageResponse(
            response.choices[0].message.content
        );
    }

    async validateApiKey(): Promise<boolean> {
        try {
            Logger.info('KimiProvider: Validating API key');
            const baseUrl = this.config.baseUrl || 'https://api.moonshot.cn/v1';
            await axios.get(`${baseUrl}/models`, {
                headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
                timeout: 5000
            });
            return true;
        } catch (error) {
            Logger.error('KimiProvider: API key validation failed', error);
            return false;
        }
    }

    protected async makeRequest(prompt: string): Promise<any> {
        try {
            const model = this.config.model || 'moonshot-v1-8k';

            Logger.debug('KimiProvider: Making API request', { model, promptLength: prompt.length });

            const response = await axios.post(
                this.endpoint,
                {
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
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            Logger.debug('KimiProvider: API response received', { status: response.status });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                Logger.error('KimiProvider: API request failed', {
                    status: error.response?.status,
                    data: error.response?.data,
                });
                throw new Error(
                    `Kimi API Error: ${error.response?.data?.error?.message || error.message}`
                );
            }
            throw error;
        }
    }
}
