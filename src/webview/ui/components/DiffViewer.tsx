import React from 'react';
import { useCommitStore } from '../store/commitStore';

/**
 * DiffViewer — shows a styled diff output for the selected file.
 * (Monaco editor is not easily embeddable in a VS Code sidebar webview
 *  due to CSP restrictions. We use a lightweight syntax-highlighted diff view instead.)
 */
export default function DiffViewer() {
    const { selectedFilePath, drafts, stagedFiles, activeView, setActiveView } = useCommitStore();

    if (activeView !== 'diff' || !selectedFilePath) {
        return null;
    }

    // Find the diff string from staged files or drafts
    const file = stagedFiles.find(f => f.path === selectedFilePath)
        || drafts.flatMap(d => d.files).find(f => f.path === selectedFilePath);

    if (!file) {
        return (
            <div className="diff-viewer">
                <div className="diff-header">
                    <span>No diff available</span>
                    <button className="btn btn-sm" onClick={() => setActiveView('tree')}>✕</button>
                </div>
            </div>
        );
    }

    const renderDiffLines = (diff: string) => {
        if (!diff || diff.trim() === '') {
            return <div className="diff-empty">Binary file or no text diff available.</div>;
        }

        return diff.split('\n').map((line, i) => {
            let cls = 'diff-line';
            if (line.startsWith('+') && !line.startsWith('+++')) cls += ' diff-add';
            else if (line.startsWith('-') && !line.startsWith('---')) cls += ' diff-del';
            else if (line.startsWith('@@')) cls += ' diff-hunk';
            else if (line.startsWith('diff ') || line.startsWith('index ')) cls += ' diff-meta';

            return (
                <div key={i} className={cls}>
                    <span className="diff-line-num">{i + 1}</span>
                    <span className="diff-line-content">{line || ' '}</span>
                </div>
            );
        });
    };

    return (
        <div className="diff-viewer">
            <div className="diff-header">
                <span className="diff-file-name">{selectedFilePath}</span>
                <div className="diff-header-stats">
                    <span className="stat-add">+{file.additions}</span>
                    <span className="stat-del">−{file.deletions}</span>
                </div>
                <button className="btn btn-sm" onClick={() => setActiveView('tree')}>✕ Close</button>
            </div>
            <div className="diff-content">
                {renderDiffLines(file.diff)}
            </div>
        </div>
    );
}
