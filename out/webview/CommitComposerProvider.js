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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitComposerProvider = void 0;
const vscode = __importStar(require("vscode"));
const orchestrator_1 = require("../core/orchestrator");
const commitExecutor_1 = require("../core/commitExecutor");
const logger_1 = require("../utils/logger");
class CommitComposerProvider {
    constructor(extensionUri, gitService) {
        this._extensionUri = extensionUri;
        this.orchestrator = new orchestrator_1.Orchestrator(gitService);
        this.commitExecutor = new commitExecutor_1.CommitExecutor(gitService);
        logger_1.Logger.info('CommitComposerProvider: Initialized');
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'dist'),
                vscode.Uri.joinPath(this._extensionUri, 'media')
            ]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        this._setWebviewMessageListener(webviewView.webview);
        // Initial load
        this.loadChanges();
    }
    _getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js'));
        const nonce = getNonce();
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
                <title>Git Composer</title>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
    _setWebviewMessageListener(webview) {
        webview.onDidReceiveMessage(async (message) => {
            logger_1.Logger.debug('CommitComposerProvider: Message received', { command: message.command });
            switch (message.command) {
                case 'loadData':
                    await this.loadChanges();
                    break;
                case 'compose':
                    await this.handleCompose(message.providerConfig);
                    break;
                case 'commitSingle':
                    await this.handleCommitSingle(message.draft);
                    break;
                case 'commitAll':
                    await this.handleCommitAll(message.drafts);
                    break;
                case 'refresh':
                    await this.loadChanges();
                    break;
            }
        });
    }
    async loadChanges() {
        if (!this._view)
            return;
        try {
            const staged = await this.orchestrator.getStagedChanges();
            this._view.webview.postMessage({
                command: 'dataLoaded',
                data: { staged }
            });
        }
        catch (e) {
            logger_1.Logger.error('CommitComposerProvider: Failed to load changes', e);
            this._view.webview.postMessage({
                command: 'error',
                message: e.message
            });
        }
    }
    async handleCompose(providerConfig) {
        if (!this._view)
            return;
        try {
            this._view.webview.postMessage({ command: 'composing' });
            const result = await this.orchestrator.compose(providerConfig);
            this._view.webview.postMessage({
                command: 'composed',
                drafts: result.drafts,
                reasoning: result.reasoning
            });
        }
        catch (e) {
            logger_1.Logger.error('CommitComposerProvider: Compose failed', e);
            this._view.webview.postMessage({
                command: 'error',
                message: e.message
            });
        }
    }
    async handleCommitSingle(draft) {
        if (!this._view)
            return;
        try {
            await this.commitExecutor.executeSingle(draft);
            vscode.window.showInformationMessage(`Committed: ${draft.message.split('\n')[0]}`);
            this._view.webview.postMessage({ command: 'commitSuccess', draftId: draft.id });
            await this.loadChanges();
        }
        catch (e) {
            logger_1.Logger.error('CommitComposerProvider: Commit failed', e);
            this._view.webview.postMessage({
                command: 'error',
                message: e.message
            });
        }
    }
    async handleCommitAll(drafts) {
        if (!this._view)
            return;
        try {
            const results = await this.commitExecutor.executeAll(drafts, (progress) => {
                this._view?.webview.postMessage({
                    command: 'commitProgress',
                    progress
                });
            });
            const successCount = results.filter(r => r.success).length;
            vscode.window.showInformationMessage(`Committed ${successCount}/${results.length} commits successfully.`);
            await this.loadChanges();
            this._view.webview.postMessage({ command: 'commitAllDone', results });
        }
        catch (e) {
            logger_1.Logger.error('CommitComposerProvider: Commit all failed', e);
            this._view.webview.postMessage({
                command: 'error',
                message: e.message
            });
        }
    }
}
exports.CommitComposerProvider = CommitComposerProvider;
CommitComposerProvider.viewType = 'commitComposer.sidebarView';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=CommitComposerProvider.js.map