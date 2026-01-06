import { FileChange } from './git';

export interface CommitGroup {
    id: string;
    message: string;
    description?: string;
    files: FileChange[];
    confidence: number;
}
