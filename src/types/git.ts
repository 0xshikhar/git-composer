export enum ChangeType {
    Modified = 'modified',
    Added = 'added',
    Deleted = 'deleted',
    Renamed = 'renamed',
    Copied = 'copied',
    Untracked = 'untracked'
}

export interface FileChange {
    path: string;
    changeType: ChangeType;
    diff: string;
    additions: number;
    deletions: number;
}

// --- Diff AST types ---

export interface DiffLine {
    type: 'add' | 'delete' | 'context';
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
}

export interface DiffHunk {
    header: string;
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: DiffLine[];
}

export interface ParsedFileDiff {
    path: string;
    oldPath?: string; // for renames
    changeType: ChangeType;
    hunks: DiffHunk[];
    additions: number;
    deletions: number;
    isBinary: boolean;
}

export interface ParsedDiff {
    files: ParsedFileDiff[];
}

// --- File clustering ---

export interface FileCluster {
    domain: string;
    files: FileChange[];
    suggestedType: string;
    suggestedScope?: string;
}

// --- Repo context ---

export interface RepoContext {
    repoName: string;
    branch: string;
    recentCommits: string[];
    projectType: string;
}
