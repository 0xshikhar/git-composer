import React from 'react';
import { useCommitStore } from '../store/commitStore';

export default function StatusBar() {
    const { isLoading, isCommitting, error, commitProgress, drafts, reasoning } = useCommitStore();

    if (isCommitting && commitProgress) {
        return (
            <div className="status-bar status-committing">
                <span className="status-icon">⏳</span>
                <span>Committing {commitProgress.current}/{commitProgress.total}…</span>
                <div className="progress-bar">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${(commitProgress.current / commitProgress.total) * 100}%` }}
                    />
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="status-bar status-loading">
                <span className="status-icon spinning">◌</span>
                <span>Analyzing changes with AI…</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="status-bar status-error">
                <span className="status-icon">⚠️</span>
                <span className="error-text">{error}</span>
            </div>
        );
    }

    if (drafts.length > 0) {
        const total = drafts.length;
        const committed = drafts.filter(d => d.state === 'committed').length;
        const avgConfidence = Math.round(
            drafts.reduce((acc, d) => acc + d.confidence, 0) / total
        );

        return (
            <div className="status-bar status-ready">
                <span className="status-icon">✅</span>
                <span>{total} draft{total !== 1 ? 's' : ''}</span>
                {committed > 0 && <span className="status-committed">({committed} committed)</span>}
                <span className="status-confidence">Avg confidence: {avgConfidence}%</span>
                {reasoning && (
                    <span className="status-reasoning" title={reasoning}>💡</span>
                )}
            </div>
        );
    }

    return null;
}
