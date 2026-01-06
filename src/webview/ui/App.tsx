import React, { useState, useEffect } from 'react';

// VS Code API wrapper
const vscode = acquireVsCodeApi();

function acquireVsCodeApi(): any {
    if ((window as any).acquireVsCodeApi) {
        return (window as any).acquireVsCodeApi();
    }
    return {
        postMessage: (msg: any) => console.log('Mock postMessage:', msg),
        getState: () => ({}),
        setState: (state: any) => { }
    };
}

export default function App() {
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [stagedFiles, setStagedFiles] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Listen for messages from extension
        const handler = (event: MessageEvent) => {
            const message = event.data;
            switch (message.command) {
                case 'dataLoaded':
                    setStagedFiles(message.data.staged);
                    setLoading(false);
                    break;
                case 'generated':
                    setGroups(message.groups);
                    setLoading(false);
                    break;
                case 'error':
                    setError(message.message);
                    setLoading(false);
                    break;
            }
        };

        window.addEventListener('message', handler);

        // Initial load
        vscode.postMessage({ command: 'loadData' });

        return () => window.removeEventListener('message', handler);
    }, []);

    const handleGenerate = () => {
        if (!apiKey) {
            setError('Please enter an OpenAI API Key');
            return;
        }
        setLoading(true);
        setError(null);
        vscode.postMessage({
            command: 'generate',
            providerConfig: {
                provider: 'openai',
                apiKey,
                model: 'gpt-4-turbo-preview'
            }
        });
    };

    const handleCommit = (group: any) => {
        vscode.postMessage({
            command: 'commit',
            group
        });
    };

    return (
        <div className="container">
            <h1>Git Commit Composer</h1>

            <div className="card">
                <label>OpenAI API Key:</label>
                <input
                    type="password"
                    className="input"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="sk-..."
                />
            </div>

            <div className="card">
                <h3>Staged Files ({stagedFiles.length})</h3>
                {stagedFiles.length === 0 && <p>No staged files found.</p>}
                <ul>
                    {stagedFiles.map(f => (
                        <li key={f.path}>{f.path} ({f.changeType})</li>
                    ))}
                </ul>
                <button className="button" onClick={handleGenerate} disabled={loading || stagedFiles.length === 0}>
                    {loading ? 'Generating...' : 'Compose Commits'}
                </button>
            </div>

            {error && <div className="error" style={{ color: 'red' }}>{error}</div>}

            {groups.length > 0 && (
                <div className="groups">
                    <h3>Suggested Commits</h3>
                    {groups.map(group => (
                        <div key={group.id} className="card">
                            <h4>{group.message.split('\n')[0]}</h4>
                            <pre style={{ whiteSpace: 'pre-wrap' }}>{group.message}</pre>
                            <div className="file-list">
                                <small>Files: {group.files.map((f: any) => f.path).join(', ')}</small>
                            </div>
                            <br />
                            <button className="button" onClick={() => handleCommit(group)}>Commit</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
