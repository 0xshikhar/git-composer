import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';

export interface ComposerConfig {
    provider: string;
    model: string;
    apiKey: string;
    baseUrl?: string;
    commitFormat: 'conventional' | 'angular' | 'gitmoji' | 'custom';
    maxSubjectLength: number;
    splitThreshold: number;
    contextLines: number;
    includeRecentCommits: boolean;
    recentCommitCount: number;
    ollamaHost: string;
}

const DEFAULT_CONFIG: ComposerConfig = {
    provider: 'openai',
    model: '',
    apiKey: '',
    commitFormat: 'conventional',
    maxSubjectLength: 72,
    splitThreshold: 3,
    contextLines: 5,
    includeRecentCommits: true,
    recentCommitCount: 10,
    ollamaHost: 'http://localhost:11434',
};

/**
 * Loads configuration from `.gitcomposer.json` (workspace root) and
 * VS Code settings, merging them with defaults.
 * Priority: .gitcomposer.json > VS Code settings > defaults.
 */
export class ConfigLoader {
    private config: ComposerConfig = { ...DEFAULT_CONFIG };
    private loaded: boolean = false;

    constructor() {
        this.load();
    }

    /**
     * Load and merge config from all sources.
     */
    load(): ComposerConfig {
        // Start with defaults
        this.config = { ...DEFAULT_CONFIG };

        // Layer 1: VS Code settings
        this.loadVSCodeSettings();

        // Layer 2: .gitcomposer.json (overrides VS Code settings)
        this.loadFileConfig();

        this.loaded = true;
        Logger.info('ConfigLoader: Configuration loaded', {
            provider: this.config.provider,
            model: this.config.model,
            commitFormat: this.config.commitFormat,
        });

        return this.config;
    }

    getConfig(): ComposerConfig {
        if (!this.loaded) {
            this.load();
        }
        return this.config;
    }

    /**
     * Save current config to .gitcomposer.json in workspace root.
     */
    saveToFile(): void {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return;

        const configPath = path.join(workspaceFolder.uri.fsPath, '.gitcomposer.json');
        const toSave: Partial<ComposerConfig> = { ...this.config };
        // Don't save apiKey to file for security
        delete (toSave as any).apiKey;

        fs.writeFileSync(configPath, JSON.stringify(toSave, null, 2), 'utf-8');
        Logger.info('ConfigLoader: Saved config to .gitcomposer.json');
    }

    private loadVSCodeSettings(): void {
        const vsConfig = vscode.workspace.getConfiguration('commitComposer');

        const provider = vsConfig.get<string>('aiProvider');
        if (provider) this.config.provider = provider;

        const apiKey = vsConfig.get<string>('apiKey');
        if (apiKey) this.config.apiKey = apiKey;

        const model = vsConfig.get<string>('model');
        if (model) this.config.model = model;

        const ollamaHost = vsConfig.get<string>('ollamaHost');
        if (ollamaHost) this.config.ollamaHost = ollamaHost;

        const commitFormat = vsConfig.get<string>('commitFormat');
        if (commitFormat) this.config.commitFormat = commitFormat as ComposerConfig['commitFormat'];
    }

    private loadFileConfig(): void {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return;

        const configPath = path.join(workspaceFolder.uri.fsPath, '.gitcomposer.json');
        if (!fs.existsSync(configPath)) return;

        try {
            const raw = fs.readFileSync(configPath, 'utf-8');
            const fileConfig = JSON.parse(raw);

            // Merge file config over current config
            if (fileConfig.provider) this.config.provider = fileConfig.provider;
            if (fileConfig.model) this.config.model = fileConfig.model;
            if (fileConfig.apiKey) this.config.apiKey = fileConfig.apiKey;
            if (fileConfig.baseUrl) this.config.baseUrl = fileConfig.baseUrl;
            if (fileConfig.commitFormat) this.config.commitFormat = fileConfig.commitFormat;
            if (fileConfig.maxSubjectLength) this.config.maxSubjectLength = fileConfig.maxSubjectLength;
            if (fileConfig.splitThreshold) this.config.splitThreshold = fileConfig.splitThreshold;
            if (fileConfig.contextLines) this.config.contextLines = fileConfig.contextLines;
            if (fileConfig.includeRecentCommits !== undefined) this.config.includeRecentCommits = fileConfig.includeRecentCommits;
            if (fileConfig.recentCommitCount) this.config.recentCommitCount = fileConfig.recentCommitCount;
            if (fileConfig.ollamaHost) this.config.ollamaHost = fileConfig.ollamaHost;

            Logger.info('ConfigLoader: Loaded .gitcomposer.json', { configPath });
        } catch (e) {
            Logger.warn('ConfigLoader: Failed to parse .gitcomposer.json', e);
        }
    }
}
