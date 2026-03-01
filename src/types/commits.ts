import { FileChange } from './git';

export type CommitState = 'draft' | 'generated' | 'edited' | 'confirmed' | 'committed';

export interface CommitGroup {
    id: string;
    message: string;
    description?: string;
    files: FileChange[];
    confidence: number;
}

export interface DraftCommit {
    id: string;
    message: string;
    description?: string;
    files: FileChange[];
    state: CommitState;
    confidence: number;
    type?: string;   // feat, fix, refactor, etc.
    scope?: string;  // auth, ui, api, etc.
}

export interface CommitInput {
    files: FileChange[];
    context: import('./git').RepoContext;
}

export interface CommitOutput {
    groups: DraftCommit[];
    reasoning?: string;
}
