"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
const react_1 = __importStar(require("react"));
const commitStore_1 = require("./store/commitStore");
const useVSCodeAPI_1 = require("./hooks/useVSCodeAPI");
const AIControls_1 = __importDefault(require("./components/AIControls"));
const FileList_1 = __importDefault(require("./components/FileList"));
const CommitTree_1 = __importDefault(require("./components/CommitTree"));
const DiffViewer_1 = __importDefault(require("./components/DiffViewer"));
const CommitEditor_1 = __importDefault(require("./components/CommitEditor"));
const StatusBar_1 = __importDefault(require("./components/StatusBar"));
require("./index.css");
function App() {
    const { stagedFiles, drafts, isLoading, isCommitting, providerConfig, activeView, setStagedFiles, setDrafts, setLoading, setCommitting, setError, setCommitProgress, markCommitted, setActiveView, } = (0, commitStore_1.useCommitStore)();
    const { postMessage, onMessage } = (0, useVSCodeAPI_1.useVSCodeAPI)();
    // Listen for messages from the extension host
    (0, react_1.useEffect)(() => {
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
        if (pending.length === 0)
            return;
        postMessage('commitAll', { drafts: pending });
    };
    const handleRefresh = () => {
        postMessage('refresh');
    };
    const pendingCount = drafts.filter(d => d.state !== 'committed').length;
    return (react_1.default.createElement("div", { className: "git-composer" },
        react_1.default.createElement("div", { className: "gc-header" },
            react_1.default.createElement("h2", { className: "gc-title" }, "Git Composer"),
            react_1.default.createElement("button", { className: "btn btn-icon", onClick: handleRefresh, title: "Refresh" }, "\u21BB")),
        react_1.default.createElement(AIControls_1.default, null),
        react_1.default.createElement("div", { className: "gc-compose-section" },
            react_1.default.createElement("button", { className: "btn btn-primary btn-full", onClick: handleCompose, disabled: isLoading || stagedFiles.length === 0 }, isLoading ? '⏳ Analyzing…' : '⚡ Auto-Compose Commits')),
        react_1.default.createElement(StatusBar_1.default, null),
        activeView === 'diff' ? (react_1.default.createElement(DiffViewer_1.default, null)) : activeView === 'editor' ? (react_1.default.createElement(CommitEditor_1.default, null)) : (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(FileList_1.default, null),
            react_1.default.createElement(CommitTree_1.default, null),
            pendingCount > 0 && (react_1.default.createElement("div", { className: "gc-commit-all-section" },
                react_1.default.createElement("button", { className: "btn btn-success btn-full", onClick: handleCommitAll, disabled: isCommitting }, isCommitting
                    ? '⏳ Committing…'
                    : `✅ Commit All (${pendingCount})`)))))));
}
//# sourceMappingURL=App.js.map