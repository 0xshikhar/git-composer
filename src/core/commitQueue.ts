import { DraftCommit } from '../types/commits';
import { CommitExecutor, CommitProgress, ProgressCallback } from './commitExecutor';
import { Logger } from '../utils/logger';

export type QueueStatus = 'idle' | 'running' | 'paused' | 'done' | 'error';

export interface QueueState {
    status: QueueStatus;
    queue: DraftCommit[];
    completed: string[];  // ids
    failed: { id: string; error: string }[];
    current: number;
    total: number;
}

/**
 * CommitQueue — manages sequential execution of multiple draft commits
 * with pause/resume/cancel support.
 */
export class CommitQueue {
    private executor: CommitExecutor;
    private state: QueueState;
    private abortController: AbortController | null = null;
    private onStateChange?: (state: QueueState) => void;

    constructor(executor: CommitExecutor, onStateChange?: (state: QueueState) => void) {
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
    enqueue(drafts: DraftCommit[]): void {
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
    async run(onProgress?: ProgressCallback): Promise<QueueState> {
        if (this.state.queue.length === 0) {
            Logger.warn('CommitQueue: No drafts to execute');
            return this.state;
        }

        this.state.status = 'running';
        this.abortController = new AbortController();
        this.emit();

        Logger.info('CommitQueue: Starting execution', { total: this.state.total });

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

            const progress: CommitProgress = {
                current: i + 1,
                total: this.state.total,
                message: draft.message,
                success: false,
            };

            try {
                await this.executor.executeSingle(draft);
                this.state.completed.push(draft.id);
                progress.success = true;
                Logger.info(`CommitQueue: Commit ${i + 1}/${this.state.total} succeeded`);
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                this.state.failed.push({ id: draft.id, error: errorMsg });
                progress.error = errorMsg;
                Logger.error(`CommitQueue: Commit ${i + 1}/${this.state.total} failed`, error);
            }

            onProgress?.(progress);
            this.emit();
        }

        if (this.state.status !== 'paused') {
            this.state.status = this.state.failed.length > 0 ? 'error' : 'done';
        }

        this.emit();
        Logger.info('CommitQueue: Execution complete', {
            completed: this.state.completed.length,
            failed: this.state.failed.length,
        });

        return this.state;
    }

    /**
     * Pause execution (current commit will finish first).
     */
    pause(): void {
        this.abortController?.abort();
    }

    /**
     * Get current queue state.
     */
    getState(): QueueState {
        return { ...this.state };
    }

    private emit(): void {
        this.onStateChange?.({ ...this.state });
    }
}
