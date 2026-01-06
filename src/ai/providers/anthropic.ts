import axios from 'axios';
import { AIProvider, AIProviderConfig, AIResponse } from '../aiProvider';
import { FileChange } from '../../types/git';
import { PromptBuilder } from '../promptBuilder';
import { ResponseParser } from '../responseParser';

export class AnthropicProvider extends AIProvider {
    private readonly endpoint = 'https://api.anthropic.com/v1/messages';

    async analyzeChanges(changes: FileChange[]): Promise<AIResponse> {
        const prompt = PromptBuilder.buildGroupingPrompt(changes);
        const response = await this.makeRequest(prompt);

        return ResponseParser.parseGroupingResponse(
            response.content[0].text,
            changes
        );
    }

    async generateCommitMessage(files: FileChange[]): Promise<string> {
        const prompt = PromptBuilder.buildMessagePrompt(files);
        const response = await this.makeRequest(prompt);

        return ResponseParser.parseMessageResponse(response.content[0].text);
    }

    async validateApiKey(): Promise<boolean> {
        try {
            // Simple validation by making a small request
            // Note: Anthropic doesn't have a simple 'validate' endpoint like OpenAI's /models that is cheap/free always, 
            // but we can try a minimal request or just assume valid if structure is correct.
            // For now, let's try a minimal request.
            await this.makeRequest('Test');
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
                    model: this.config.model || 'claude-3-sonnet-20240229',
                    max_tokens: this.config.maxTokens || 2000,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: this.config.temperature || 0.3
                },
                {
                    headers: {
                        'x-api-key': this.config.apiKey,
                        'anthropic-version': '2023-06-01',
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `Anthropic API Error: ${error.response?.data?.error?.message || error.message}`
                );
            }
            throw error;
        }
    }
}
