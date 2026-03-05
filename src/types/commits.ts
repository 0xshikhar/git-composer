import { FileChange } from './git';

export type CommitState = 'draft' | 'generated' | 'edited' | 'confirmed' | 'committed';

export interface CommitGroup {
    id: string;
    message: string;
    description?: string;
    files: FileChange[];
    confidence: number;
    rationale?: string;
    impact?: string;
    verificationSteps?: string[];
    risks?: string[];
}

export interface DraftCommit {
    id: string;
    message: string;
    description?: string;
    files: FileChange[];
    state: CommitState;
    confidence: number;
    type?: string; // feat, fix, refactor, etc.
    scope?: string; // auth, ui, api, etc.
    rationale?: string;
    impact?: string;
    verificationSteps?: string[];
    risks?: string[];
}

export interface CommitInput {
    files: FileChange[];
    context: import('./git').RepoContext;
}

export interface CommitOutput {
    groups: DraftCommit[];
    reasoning?: string;
    summary?: string;
}
