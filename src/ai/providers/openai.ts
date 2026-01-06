import axios from 'axios';
import { AIProvider, AIProviderConfig, AIResponse } from '../aiProvider';
import { FileChange } from '../../types/git';
import { PromptBuilder } from '../promptBuilder';
import { ResponseParser } from '../responseParser';

export class OpenAIProvider extends AIProvider {
    private readonly endpoint = 'https://api.openai.com/v1/chat/completions';

    constructor(config: AIProviderConfig) {
        super(config);
    }

    async analyzeChanges(changes: FileChange[]): Promise<AIResponse> {
        const prompt = PromptBuilder.buildGroupingPrompt(changes);

        const response = await this.makeRequest(prompt);

        // OpenAI's chat completion format
        const content = response.choices[0].message.content;
        return ResponseParser.parseGroupingResponse(content, changes);
    }

    async generateCommitMessage(files: FileChange[]): Promise<string> {
        const prompt = PromptBuilder.buildMessagePrompt(files);

        const response = await this.makeRequest(prompt);

        return ResponseParser.parseMessageResponse(
            response.choices[0].message.content
        );
    }

    async validateApiKey(): Promise<boolean> {
        try {
            await axios.get('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                timeout: 5000
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    protected async makeRequest(prompt: string): Promise<any> {
        try {
            const response = await axios.post(
                this.endpoint,
                {
                    model: this.config.model || 'gpt-4-turbo-preview',
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
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `OpenAI API Error: ${error.response?.data?.error?.message || error.message}`
                );
            }
            throw error;
        }
    }
}
