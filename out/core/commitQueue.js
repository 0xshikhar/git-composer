"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitQueue = void 0;
const logger_1 = require("../utils/logger");
/**
 * CommitQueue — manages sequential execution of multiple draft commits
 * with pause/resume/cancel support.
 */
class CommitQueue {
    constructor(executor, onStateChange) {
        this.abortController = null;
        this.executor = executor;
        this.onStateChange = onStateChange;
        this.state = {
            status: 'idle',
            queue: [],
            completed: [],
            failed: [],
            current: 0,
            total: 0,
        };
    }
    /**
     * Enqueue drafts for execution.
     */
    enqueue(drafts) {
        this.state = {
            status: 'idle',
            queue: [...drafts],
            completed: [],
            failed: [],
            current: 0,
            total: drafts.length,
        };
        this.emit();
    }
    /**
     * Start executing the queue.
     */
    async run(onProgress) {
        if (this.state.queue.length === 0) {
            logger_1.Logger.warn('CommitQueue: No drafts to execute');
            return this.state;
        }
        this.state.status = 'running';
        this.abortController = new AbortController();
        this.emit();
        logger_1.Logger.info('CommitQueue: Starting execution', { total: this.state.total });
        for (let i = 0; i < this.state.queue.length; i++) {
            // Check if aborted
            if (this.abortController.signal.aborted) {
                this.state.status = 'paused';
                this.emit();
                break;
            }
            const draft = this.state.queue[i];
            this.state.current = i + 1;
            this.emit();
            const progress = {
                current: i + 1,
                total: this.state.total,
                message: draft.message,
                success: false,
            };
            try {
                await this.executor.executeSingle(draft);
                this.state.completed.push(draft.id);
                progress.success = true;
                logger_1.Logger.info(`CommitQueue: Commit ${i + 1}/${this.state.total} succeeded`);
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                this.state.failed.push({ id: draft.id, error: errorMsg });
                progress.error = errorMsg;
                logger_1.Logger.error(`CommitQueue: Commit ${i + 1}/${this.state.total} failed`, error);
            }
            onProgress?.(progress);
            this.emit();
        }
        if (this.state.status !== 'paused') {
            this.state.status = this.state.failed.length > 0 ? 'error' : 'done';
        }
        this.emit();
        logger_1.Logger.info('CommitQueue: Execution complete', {
            completed: this.state.completed.length,
            failed: this.state.failed.length,
        });
        return this.state;
    }
    /**
     * Pause execution (current commit will finish first).
     */
    pause() {
        this.abortController?.abort();
    }
    /**
     * Get current queue state.
     */
    getState() {
        return { ...this.state };
    }
    emit() {
        this.onStateChange?.({ ...this.state });
    }
}
exports.CommitQueue = CommitQueue;
//# sourceMappingURL=commitQueue.js.map