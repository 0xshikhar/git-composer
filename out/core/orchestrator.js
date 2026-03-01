"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orchestrator = void 0;
const commitSplitter_1 = require("./commit/commitSplitter");
const commitExecutor_1 = require("./commitExecutor");
const aiProviderFactory_1 = require("../ai/aiProviderFactory");
const configLoader_1 = require("./configLoader");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
/**
 * Orchestrator — coordinates the full pipeline:
 *   getStagedChanges → parseDiff → classifyFiles → splitIntoClusters → generateCommitsWithAI → DraftCommit[]
 */
class Orchestrator {
    constructor(gitService) {
        this.gitService = gitService;
        this.commitSplitter = new commitSplitter_1.CommitSplitter();
        this.commitExecutor = new commitExecutor_1.CommitExecutor(gitService);
        this.configLoader = new configLoader_1.ConfigLoader();
    }
    /**
     * Full pipeline: staged changes → draft commits via AI.
     */
    async compose(providerConfig) {
        // 1. Get staged changes
        const stagedChanges = await this.gitService.getStagedChanges();
        if (stagedChanges.length === 0) {
            throw new Error('No staged changes to compose.');
        }
        logger_1.Logger.info('Orchestrator: Composing commits', { fileCount: stagedChanges.length });
        // 2. Get repo context
        const context = await this.gitService.getRepoContext();
        // 3. Load config
        const config = this.configLoader.getConfig();
        // 4. If we have an AI provider, use it for intelligent grouping
        if (providerConfig) {
            return this.composeWithAI(stagedChanges, context, providerConfig, config);
        }
        // 5. Fallback: use heuristic splitter only
        return this.composeWithHeuristics(stagedChanges, context, config);
    }
    /**
     * AI-powered composition.
     */
    async composeWithAI(changes, context, providerConfig, config) {
        const aiConfig = {
            apiKey: providerConfig.apiKey,
            model: providerConfig.model,
            baseUrl: providerConfig.baseUrl,
        };
        this.aiProvider = aiProviderFactory_1.AIProviderFactory.create(providerConfig.provider, aiConfig);
        logger_1.Logger.info('Orchestrator: Analyzing with AI', {
            provider: providerConfig.provider,
            model: providerConfig.model,
        });
        const result = await this.aiProvider.analyzeChanges(changes);
        const drafts = result.groups.map(group => ({
            id: group.id || (0, uuid_1.v4)(),
            message: group.message,
            description: group.description,
            files: group.files,
            state: 'generated',
            confidence: group.confidence,
        }));
        logger_1.Logger.info('Orchestrator: AI generated drafts', { count: drafts.length });
        return { drafts, reasoning: result.reasoning };
    }
    /**
     * Heuristic-only composition (no AI).
     */
    composeWithHeuristics(changes, context, config) {
        const clusters = this.commitSplitter.split(changes);
        const drafts = clusters.map(cluster => {
            const scope = cluster.suggestedScope ? `(${cluster.suggestedScope})` : '';
            const fileNames = cluster.files.map(f => f.path.split('/').pop()).join(', ');
            const message = `${cluster.suggestedType}${scope}: update ${fileNames}`;
            return {
                id: (0, uuid_1.v4)(),
                message,
                description: undefined,
                files: cluster.files,
                state: 'draft',
                confidence: 60,
                type: cluster.suggestedType,
                scope: cluster.suggestedScope,
            };
        });
        return Promise.resolve({
            drafts,
            reasoning: 'Generated using heuristic file clustering (no AI).',
        });
    }
    /**
     * Execute a single draft commit.
     */
    async commitSingle(draft) {
        await this.commitExecutor.executeSingle(draft);
    }
    /**
     * Execute all draft commits in sequence.
     */
    async commitAll(drafts, onProgress) {
        return this.commitExecutor.executeAll(drafts, onProgress);
    }
    /**
     * Get staged changes.
     */
    async getStagedChanges() {
        return this.gitService.getStagedChanges();
    }
    /**
     * Get repo context.
     */
    async getRepoContext() {
        return this.gitService.getRepoContext();
    }
}
exports.Orchestrator = Orchestrator;
//# sourceMappingURL=orchestrator.js.map