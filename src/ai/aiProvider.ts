import { CommitGroup } from '../types/commits';
import { FileChange } from '../types/git';

export interface AIProviderConfig {
    apiKey: string;
    model: string;
    baseUrl?: string;
    maxTokens?: number;
    temperature?: number;
}

export interface AIResponse {
    groups: CommitGroup[];
    reasoning?: string;
    tokensUsed?: number;
}

export abstract class AIProvider {
    protected config: AIProviderConfig;

    constructor(config: AIProviderConfig) {
        this.config = config;
    }

    abstract analyzeChanges(changes: FileChange[]): Promise<AIResponse>;
    abstract generateCommitMessage(files: FileChange[]): Promise<string>;
    abstract validateApiKey(): Promise<boolean>;

    protected abstract makeRequest(prompt: string): Promise<any>;
}
