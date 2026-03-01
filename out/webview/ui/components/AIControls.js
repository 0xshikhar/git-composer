"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AIControls;
const react_1 = __importDefault(require("react"));
const commitStore_1 = require("../store/commitStore");
const PROVIDERS = [
    { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
    { value: 'anthropic', label: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-3-haiku-20240307'] },
    { value: 'gemini', label: 'Google Gemini', models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'] },
    { value: 'kimi', label: 'Kimi (Moonshot)', models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'] },
    { value: 'ollama', label: 'Ollama (Local)', models: ['llama3.2', 'mistral', 'codellama', 'deepseek-coder'] },
];
function AIControls() {
    const { providerConfig, setProviderConfig, isLoading } = (0, commitStore_1.useCommitStore)();
    const selectedProvider = PROVIDERS.find(p => p.value === providerConfig.provider) || PROVIDERS[0];
    const isLocal = providerConfig.provider === 'ollama';
    return (react_1.default.createElement("div", { className: "ai-controls" },
        react_1.default.createElement("div", { className: "ai-controls-header" },
            react_1.default.createElement("span", { className: "section-label" }, "\u26A1 AI Provider")),
        react_1.default.createElement("div", { className: "ai-control-row" },
            react_1.default.createElement("label", { className: "ai-label" }, "Provider"),
            react_1.default.createElement("select", { className: "ai-select", value: providerConfig.provider, onChange: (e) => setProviderConfig({ provider: e.target.value, model: '' }), disabled: isLoading }, PROVIDERS.map(p => (react_1.default.createElement("option", { key: p.value, value: p.value }, p.label))))),
        !isLocal && (react_1.default.createElement("div", { className: "ai-control-row" },
            react_1.default.createElement("label", { className: "ai-label" }, "API Key"),
            react_1.default.createElement("input", { type: "password", className: "ai-input", value: providerConfig.apiKey, onChange: (e) => setProviderConfig({ apiKey: e.target.value }), placeholder: "Enter API Key", disabled: isLoading }))),
        isLocal && (react_1.default.createElement("div", { className: "ai-control-row" },
            react_1.default.createElement("label", { className: "ai-label" }, "Host"),
            react_1.default.createElement("input", { type: "text", className: "ai-input", value: providerConfig.baseUrl || 'http://localhost:11434', onChange: (e) => setProviderConfig({ baseUrl: e.target.value }), placeholder: "http://localhost:11434", disabled: isLoading }))),
        react_1.default.createElement("div", { className: "ai-control-row" },
            react_1.default.createElement("label", { className: "ai-label" }, "Model"),
            react_1.default.createElement("select", { className: "ai-select", value: providerConfig.model, onChange: (e) => setProviderConfig({ model: e.target.value }), disabled: isLoading },
                react_1.default.createElement("option", { value: "" }, "Default"),
                selectedProvider.models.map(m => (react_1.default.createElement("option", { key: m, value: m }, m)))))));
}
//# sourceMappingURL=AIControls.js.map