import simpleGit, { SimpleGit, DiffResult } from 'simple-git';
import * as vscode from 'vscode';
import { FileChange, ChangeType } from '../types/git';

export class GitService {
    private git: SimpleGit;

    constructor() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }
        this.git = simpleGit(workspaceFolder.uri.fsPath);
    }

    async getStagedChanges(): Promise<FileChange[]> {
        const status = await this.git.status();
        const changes: FileChange[] = [];

        for (const file of status.files) {
            // 'index' represents the status of the file in the index (staged)
            if (file.index !== ' ' && file.index !== '?') {
                const diff = await this.getFileDiff(file.path, true);
                changes.push({
                    path: file.path,
                    changeType: this.mapChangeType(file.index),
                    diff: diff,
                    additions: this.countAdditions(diff),
                    deletions: this.countDeletions(diff)
                });
            }
        }

        return changes;
    }

    async getUnstagedChanges(): Promise<FileChange[]> {
        const status = await this.git.status();
        const changes: FileChange[] = [];

        for (const file of status.files) {
            // 'working_dir' represents the status of the file in the working directory (unstaged)
            if (file.working_dir !== ' ' && file.working_dir !== '?') {
                const diff = await this.getFileDiff(file.path, false);
                changes.push({
                    path: file.path,
                    changeType: this.mapChangeType(file.working_dir),
                    diff: diff,
                    additions: this.countAdditions(diff),
                    deletions: this.countDeletions(diff)
                });
            }
        }

        return changes;
    }

    async getFileDiff(filePath: string, staged: boolean): Promise<string> {
        const args = staged ? ['--cached'] : [];
        const diff = await this.git.diff([...args, '--', filePath]);
        return diff;
    }

    async stageFiles(files: string[]): Promise<void> {
        await this.git.add(files);
    }

    async unstageFiles(files: string[]): Promise<void> {
        await this.git.reset(['HEAD', '--', ...files]);
    }

    async createCommit(message: string, files: string[]): Promise<void> {
        // Stage only specified files
        // First we need to know what is currently staged to restore it later?
        // Or we assume the user wants to commit ONLY these files as a group.
        // The Idea.md says "intelligently groups staged changes".
        // So they are ALREADY staged.
        // If we want to commit a SUBSET of staged changes, we effectively need to:
        // 1. Unstage everything? No, that loses the intent of what was staged vs unstaged.
        // 2. Commit --only <files>? Does git support commit only specific files from index?
        //    Git commit <files> stages them and commits them. But if they are ALREADY staged, it works.
        //    However, if we have files A, B, C staged, and we want to commit only A and B.
        //    We can run `git commit -m "msg" -- A B`.

        await this.git.commit(message, files);
    }

    private mapChangeType(gitStatus: string): ChangeType {
        switch (gitStatus) {
            case 'M': return ChangeType.Modified;
            case 'A': return ChangeType.Added;
            case 'D': return ChangeType.Deleted;
            case 'R': return ChangeType.Renamed;
            default: return ChangeType.Modified;
        }
    }

    private countAdditions(diff: string): number {
        return (diff.match(/^\+(?!\+\+)/gm) || []).length;
    }

    private countDeletions(diff: string): number {
        return (diff.match(/^-(?!--)/gm) || []).length;
    }
}
