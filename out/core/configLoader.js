"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigLoader = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("../utils/logger");
const DEFAULT_CONFIG = {
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
class ConfigLoader {
    constructor() {
        this.config = { ...DEFAULT_CONFIG };
        this.loaded = false;
        this.load();
    }
    /**
     * Load and merge config from all sources.
     */
    load() {
        // Start with defaults
        this.config = { ...DEFAULT_CONFIG };
        // Layer 1: VS Code settings
        this.loadVSCodeSettings();
        // Layer 2: .gitcomposer.json (overrides VS Code settings)
        this.loadFileConfig();
        this.loaded = true;
        logger_1.Logger.info('ConfigLoader: Configuration loaded', {
            provider: this.config.provider,
            model: this.config.model,
            commitFormat: this.config.commitFormat,
        });
        return this.config;
    }
    getConfig() {
        if (!this.loaded) {
            this.load();
        }
        return this.config;
    }
    /**
     * Save current config to .gitcomposer.json in workspace root.
     */
    saveToFile() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder)
            return;
        const configPath = path.join(workspaceFolder.uri.fsPath, '.gitcomposer.json');
        const toSave = { ...this.config };
        // Don't save apiKey to file for security
        delete toSave.apiKey;
        fs.writeFileSync(configPath, JSON.stringify(toSave, null, 2), 'utf-8');
        logger_1.Logger.info('ConfigLoader: Saved config to .gitcomposer.json');
    }
    loadVSCodeSettings() {
        const vsConfig = vscode.workspace.getConfiguration('commitComposer');
        const provider = vsConfig.get('aiProvider');
        if (provider)
            this.config.provider = provider;
        const apiKey = vsConfig.get('apiKey');
        if (apiKey)
            this.config.apiKey = apiKey;
        const model = vsConfig.get('model');
        if (model)
            this.config.model = model;
        const ollamaHost = vsConfig.get('ollamaHost');
        if (ollamaHost)
            this.config.ollamaHost = ollamaHost;
        const commitFormat = vsConfig.get('commitFormat');
        if (commitFormat)
            this.config.commitFormat = commitFormat;
    }
    loadFileConfig() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder)
            return;
        const configPath = path.join(workspaceFolder.uri.fsPath, '.gitcomposer.json');
        if (!fs.existsSync(configPath))
            return;
        try {
            const raw = fs.readFileSync(configPath, 'utf-8');
            const fileConfig = JSON.parse(raw);
            // Merge file config over current config
            if (fileConfig.provider)
                this.config.provider = fileConfig.provider;
            if (fileConfig.model)
                this.config.model = fileConfig.model;
            if (fileConfig.apiKey)
                this.config.apiKey = fileConfig.apiKey;
            if (fileConfig.baseUrl)
                this.config.baseUrl = fileConfig.baseUrl;
            if (fileConfig.commitFormat)
                this.config.commitFormat = fileConfig.commitFormat;
            if (fileConfig.maxSubjectLength)
                this.config.maxSubjectLength = fileConfig.maxSubjectLength;
            if (fileConfig.splitThreshold)
                this.config.splitThreshold = fileConfig.splitThreshold;
            if (fileConfig.contextLines)
                this.config.contextLines = fileConfig.contextLines;
            if (fileConfig.includeRecentCommits !== undefined)
                this.config.includeRecentCommits = fileConfig.includeRecentCommits;
            if (fileConfig.recentCommitCount)
                this.config.recentCommitCount = fileConfig.recentCommitCount;
            if (fileConfig.ollamaHost)
                this.config.ollamaHost = fileConfig.ollamaHost;
            logger_1.Logger.info('ConfigLoader: Loaded .gitcomposer.json', { configPath });
        }
        catch (e) {
            logger_1.Logger.warn('ConfigLoader: Failed to parse .gitcomposer.json', e);
        }
    }
}
exports.ConfigLoader = ConfigLoader;
//# sourceMappingURL=configLoader.js.map