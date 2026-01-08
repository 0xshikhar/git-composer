import axios from 'axios';
import { AIProvider, AIProviderConfig, AIResponse } from '../aiProvider';
import { FileChange } from '../../types/git';
import { PromptBuilder } from '../promptBuilder';
import { ResponseParser } from '../responseParser';

export class GoogleProvider extends AIProvider {
    private readonly endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';

    constructor(config: AIProviderConfig) {
        super(config);
    }

    async analyzeChanges(changes: FileChange[]): Promise<AIResponse> {
        const prompt = PromptBuilder.buildGroupingPrompt(changes);
        const response = await this.makeRequest(prompt);

        return ResponseParser.parseGroupingResponse(
            response.candidates[0].content.parts[0].text,
            changes
        );
    }

    async generateCommitMessage(files: FileChange[]): Promise<string> {
        const prompt = PromptBuilder.buildMessagePrompt(files);
        const response = await this.makeRequest(prompt);

        return ResponseParser.parseMessageResponse(
            response.candidates[0].content.parts[0].text
        );
    }

    async validateApiKey(): Promise<boolean> {
        try {
            // Simple validation by listing models or making a small generation request
            // Listing models doesn't always prove the key works for generation, but it's a start.
            // A better way is a small generation.
            await this.makeRequest('Test');
            return true;
        } catch (error) {
            return false;
        }
    }

    protected async makeRequest(prompt: string): Promise<any> {
        try {
            const model = this.config.model || 'gemini-pro';
            const url = `${this.endpoint}/${model}:generateContent?key=${this.config.apiKey}`;

            const response = await axios.post(
                url,
                {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: this.config.temperature || 0.3,
                        maxOutputTokens: this.config.maxTokens || 2000
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `Google API Error: ${error.response?.data?.error?.message || error.message}`
                );
            }
            throw error;
        }
    }
}
