import React from 'react';
import { useCommitStore } from '../store/commitStore';

const PROVIDERS = [
    { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
    { value: 'anthropic', label: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-3-haiku-20240307'] },
    { value: 'gemini', label: 'Google Gemini', models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'] },
    { value: 'kimi', label: 'Kimi (Moonshot)', models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'] },
    { value: 'ollama', label: 'Ollama (Local)', models: ['llama3.2', 'mistral', 'codellama', 'deepseek-coder'] },
];

export default function AIControls() {
    const { providerConfig, setProviderConfig, isLoading } = useCommitStore();

    const selectedProvider = PROVIDERS.find(p => p.value === providerConfig.provider) || PROVIDERS[0];
    const isLocal = providerConfig.provider === 'ollama';

    return (
        <div className="ai-controls">
            <div className="ai-controls-header">
                <span className="section-label">⚡ AI Provider</span>
            </div>

            <div className="ai-control-row">
                <label className="ai-label">Provider</label>
                <select
                    className="ai-select"
                    value={providerConfig.provider}
                    onChange={(e) => setProviderConfig({ provider: e.target.value, model: '' })}
                    disabled={isLoading}
                >
                    {PROVIDERS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                </select>
            </div>

            {!isLocal && (
                <div className="ai-control-row">
                    <label className="ai-label">API Key</label>
                    <input
                        type="password"
                        className="ai-input"
                        value={providerConfig.apiKey}
                        onChange={(e) => setProviderConfig({ apiKey: e.target.value })}
                        placeholder="Enter API Key"
                        disabled={isLoading}
                    />
                </div>
            )}

            {isLocal && (
                <div className="ai-control-row">
                    <label className="ai-label">Host</label>
                    <input
                        type="text"
                        className="ai-input"
                        value={providerConfig.baseUrl || 'http://localhost:11434'}
                        onChange={(e) => setProviderConfig({ baseUrl: e.target.value })}
                        placeholder="http://localhost:11434"
                        disabled={isLoading}
                    />
                </div>
            )}

            <div className="ai-control-row">
                <label className="ai-label">Model</label>
                <select
                    className="ai-select"
                    value={providerConfig.model}
                    onChange={(e) => setProviderConfig({ model: e.target.value })}
                    disabled={isLoading}
                >
                    <option value="">Default</option>
                    {selectedProvider.models.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
