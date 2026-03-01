import React from 'react';
import { useCommitStore } from '../store/commitStore';

export default function FileList() {
    const { stagedFiles, selectFile } = useCommitStore();

    if (stagedFiles.length === 0) {
        return (
            <div className="file-list-empty">
                <p className="empty-text">No staged changes.</p>
                <p className="empty-hint">Stage files with <code>git add</code> to begin composing.</p>
            </div>
        );
    }

    const totalAdd = stagedFiles.reduce((acc, f) => acc + f.additions, 0);
    const totalDel = stagedFiles.reduce((acc, f) => acc + f.deletions, 0);

    return (
        <div className="file-list">
            <div className="file-list-header">
                <span className="section-label">
                    Staged Changes ({stagedFiles.length})
                </span>
                <div className="file-list-stats">
                    <span className="stat-add">+{totalAdd}</span>
                    <span className="stat-del">−{totalDel}</span>
                </div>
            </div>
            <div className="file-list-items">
                {stagedFiles.map(file => (
                    <div
                        key={file.path}
                        className="file-list-item"
                        onClick={() => selectFile(file.path)}
                        title={file.path}
                    >
                        <span className={`change-badge ${file.changeType}`}>
                            {file.changeType[0].toUpperCase()}
                        </span>
                        <span className="file-name">
                            {file.path.split('/').pop()}
                        </span>
                        <span className="file-stats">
                            <span className="stat-add">+{file.additions}</span>
                            <span className="stat-del">−{file.deletions}</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
