export enum ChangeType {
    Modified = 'modified',
    Added = 'added',
    Deleted = 'deleted',
    Renamed = 'renamed'
}

export interface FileChange {
    path: string;
    changeType: ChangeType;
    diff: string;
    additions: number;
    deletions: number;
}


