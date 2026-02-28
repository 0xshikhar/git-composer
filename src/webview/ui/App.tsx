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
    const [provider, setProvider] = useState('openai');
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('');
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

    useEffect(() => {
        if (provider === 'openai') {
            setModel('gpt-5-mini');
        } else if (provider === 'google') {
            setModel('gemini-2.5-flash');
        } else {
            setModel('');
        }
    }, [provider]);

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
                provider: provider,
                apiKey,
                model: model
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
                <label>AI Provider:</label>
                <select className="input" value={provider} onChange={e => setProvider(e.target.value)}>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google Gemini</option>
                    <option value="groq">Groq</option>
                </select>

                <label>API Key:</label>
                <input
                    type="password"
                    className="input"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="Enter API Key"
                />

                <label>Model (Optional):</label>
                {['openai', 'google'].includes(provider) ? (
                    <select
                        className="input"
                        value={model}
                        onChange={e => setModel(e.target.value)}
                    >
                        {provider === 'openai' && (
                            <>
                                <option value="gpt-5.2">GPT-5.2</option>
                                <option value="gpt-5.1">GPT-5.1</option>
                                <option value="gpt-5">GPT-5</option>
                                <option value="gpt-5-mini">GPT-5 mini (Recommended)</option>
                                <option value="gpt-5-nano">GPT-5 nano</option>
                                <option value="gpt-4.1">GPT-4.1</option>
                                <option value="o4-mini">o4 mini</option>
                                <option value="o3">o3</option>
                                <option value="o3-pro">o3 Pro</option>
                                <option value="o3-mini">o3 mini</option>
                                <option value="gpt-4o">GPT-4o</option>
                            </>
                        )}
                        {provider === 'google' && (
                            <>
                                <option value="gemini-3.0-pro-preview">Gemini 3 Pro (Preview)</option>
                                <option value="gemini-3.0-flash-preview">Gemini 3 Flash (Preview)</option>
                                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
                                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite</option>
                                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash 8B</option>
                            </>
                        )}
                    </select>
                ) : (
                    <input
                        type="text"
                        className="input"
                        value={model}
                        onChange={e => setModel(e.target.value)}
                        placeholder="e.g. claude-3, llama3-70b"
                    />
                )}
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
