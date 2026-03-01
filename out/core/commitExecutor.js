"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitExecutor = void 0;
const logger_1 = require("../utils/logger");
/**
 * Executes commits atomically — stages only the files for each commit,
 * commits, then moves to the next.
 */
class CommitExecutor {
    constructor(gitService) {
        this.gitService = gitService;
    }
    /**
     * Execute a single draft commit.
     */
    async executeSingle(draft) {
        const filePaths = draft.files.map(f => f.path);
        await this.gitService.createCommit(draft.message, filePaths);
    }
    /**
     * Execute multiple draft commits in sequence.
     * Each commit: unstage all → stage group files → commit.
     */
    async executeAll(drafts, onProgress) {
        const results = [];
        for (let i = 0; i < drafts.length; i++) {
            const draft = drafts[i];
            const progress = {
                current: i + 1,
                total: drafts.length,
                message: draft.message,
                success: false,
            };
            try {
                logger_1.Logger.info(`CommitExecutor: Executing commit ${i + 1}/${drafts.length}`, {
                    message: draft.message,
                    files: draft.files.map(f => f.path),
                });
                // Unstage all, then stage only this group
                await this.gitService.unstageAll();
                await this.gitService.stageFiles(draft.files.map(f => f.path));
                await this.gitService.createCommit(draft.message, draft.files.map(f => f.path));
                progress.success = true;
                logger_1.Logger.info(`CommitExecutor: Commit ${i + 1} succeeded`);
            }
            catch (error) {
                progress.error = error instanceof Error ? error.message : 'Unknown error';
                logger_1.Logger.error(`CommitExecutor: Commit ${i + 1} failed`, error);
            }
            results.push(progress);
            onProgress?.(progress);
        }
        return results;
    }
}
exports.CommitExecutor = CommitExecutor;
//# sourceMappingURL=commitExecutor.js.map