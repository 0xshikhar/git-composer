import React, { useEffect } from 'react';
import { useCommitStore } from './store/commitStore';
import { useVSCodeAPI } from './hooks/useVSCodeAPI';
import AIControls from './components/AIControls';
import FileList from './components/FileList';
import CommitTree from './components/CommitTree';
import DiffViewer from './components/DiffViewer';
import CommitEditor from './components/CommitEditor';
import StatusBar from './components/StatusBar';
import './index.css';

export default function App() {
    const {
        stagedFiles,
        drafts,
        isLoading,
        isCommitting,
        providerConfig,
        activeView,
        setStagedFiles,
        setDrafts,
        setLoading,
        setCommitting,
        setError,
        setCommitProgress,
        markCommitted,
        setActiveView,
    } = useCommitStore();

    const { postMessage, onMessage } = useVSCodeAPI();

    // Listen for messages from the extension host
    useEffect(() => {
        const unsub = onMessage((message) => {
            switch (message.command) {
                case 'dataLoaded':
                    setStagedFiles(message.data.staged || []);
                    break;

                case 'composing':
                    setLoading(true);
                    setError(null);
                    break;

                case 'composed':
                    setDrafts(message.drafts || [], message.reasoning);
                    setLoading(false);
                    break;

                case 'commitSuccess':
                    markCommitted(message.draftId);
                    setCommitting(false);
                    break;

                case 'commitProgress':
                    setCommitting(true);
                    setCommitProgress(message.progress);
                    break;

                case 'commitAllDone':
                    setCommitting(false);
                    setCommitProgress(null);
                    break;

                case 'error':
                    setError(message.message);
                    setLoading(false);
                    setCommitting(false);
                    break;
            }
        });

        // Request initial data
        postMessage('loadData');

        return unsub;
    }, []);

    const handleCompose = () => {
        if (!providerConfig.apiKey && providerConfig.provider !== 'ollama') {
            setError('Please enter an API key for the selected provider.');
            return;
        }
        setError(null);
        postMessage('compose', { providerConfig });
    };

    const handleCommitAll = () => {
        const pending = drafts.filter(d => d.state !== 'committed');
        if (pending.length === 0) return;
        postMessage('commitAll', { drafts: pending });
    };

    const handleRefresh = () => {
        postMessage('refresh');
    };

    const pendingCount = drafts.filter(d => d.state !== 'committed').length;

    return (
        <div className="git-composer">
            {/* Header */}
            <div className="gc-header">
                <h2 className="gc-title">OpenGit Composer</h2>
                <button className="btn btn-icon" onClick={handleRefresh} title="Refresh">↻</button>
            </div>

            {/* AI Controls */}
            <AIControls />

            {/* Compose Button */}
            <div className="gc-compose-section">
                <button
                    className="btn btn-primary btn-full"
                    onClick={handleCompose}
                    disabled={isLoading || stagedFiles.length === 0}
                >
                    {isLoading ? '⏳ Analyzing…' : '⚡ Auto-Compose Commits'}
                </button>
            </div>

            {/* Status Bar */}
            <StatusBar />

            {/* Main Content */}
            {activeView === 'diff' ? (
                <DiffViewer />
            ) : activeView === 'editor' ? (
                <CommitEditor />
            ) : (
                <>
                    {/* File List */}
                    <FileList />

                    {/* Draft Commits */}
                    <CommitTree />

                    {/* Commit All Button */}
                    {pendingCount > 0 && (
                        <div className="gc-commit-all-section">
                            <button
                                className="btn btn-success btn-full"
                                onClick={handleCommitAll}
                                disabled={isCommitting}
                            >
                                {isCommitting
                                    ? '⏳ Committing…'
                                    : `✅ Commit All (${pendingCount})`}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
