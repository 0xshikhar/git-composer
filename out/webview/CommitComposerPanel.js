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
exports.CommitComposerPanel = void 0;
const vscode = __importStar(require("vscode"));
const aiProviderFactory_1 = require("../ai/aiProviderFactory");
const logger_1 = require("../utils/logger");
class CommitComposerPanel {
    constructor(panel, extensionUri, gitService) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        this.gitService = gitService;
        logger_1.Logger.info('CommitComposerPanel: Panel created');
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getHtmlForWebview();
        this._setWebviewMessageListener();
    }
    static createOrShow(extensionUri, gitService) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (CommitComposerPanel.currentPanel) {
            logger_1.Logger.info('CommitComposerPanel: Revealing existing panel');
            CommitComposerPanel.currentPanel._panel.reveal(column);
            return;
        }
        logger_1.Logger.info('CommitComposerPanel: Creating new panel');
        const panel = vscode.window.createWebviewPanel('commitComposer', 'Commit Composer', column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, 'dist'),
                vscode.Uri.joinPath(extensionUri, 'media')
            ]
        });
        CommitComposerPanel.currentPanel = new CommitComposerPanel(panel, extensionUri, gitService);
    }
    static revive(panel, extensionUri, gitService) {
        logger_1.Logger.info('CommitComposerPanel: Reviving panel');
        CommitComposerPanel.currentPanel = new CommitComposerPanel(panel, extensionUri, gitService);
    }
    dispose() {
        logger_1.Logger.info('CommitComposerPanel: Disposing panel');
        CommitComposerPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    _getHtmlForWebview() {
        const scriptUri = this._panel.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js'));
        const styleMainUri = this._panel.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'main.css')); // If we have CSS extracted or we can rely on style-loader injecting it.
        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce();
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this._panel.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <title>Commit Composer</title>
                <!-- <link href="${styleMainUri}" rel="stylesheet"> --> 
                <!-- Style loader usually injects styles, but if we used MiniCssExtractPlugin we'd need a link. 
                     Since we used style-loader, no link needed for main.css if it's imported in js. -->
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
    _setWebviewMessageListener() {
        this._panel.webview.onDidReceiveMessage(async (message) => {
            logger_1.Logger.debug('CommitComposerPanel: Received message from webview', { command: message.command });
            switch (message.command) { // Using 'command' instead of 'type' to be consistent if needed, but 'type' is fine.
                case 'loadData':
                    await this.loadChanges();
                    break;
                case 'generate':
                    await this.handleGenerate(message.providerConfig);
                    break;
                case 'commit':
                    await this.handleCommit(message.group);
                    break;
            }
        }, null, this._disposables);
    }
    async loadChanges() {
        try {
            logger_1.Logger.info('CommitComposerPanel: Loading staged changes');
            const staged = await this.gitService.getStagedChanges();
            logger_1.Logger.info('CommitComposerPanel: Staged changes loaded', { count: staged.length });
            this._panel.webview.postMessage({
                command: 'dataLoaded',
                data: { staged }
            });
        }
        catch (e) {
            logger_1.Logger.error('CommitComposerPanel: Failed to load changes', e);
            this._panel.webview.postMessage({
                command: 'error',
                message: e.message
            });
        }
    }
    async handleGenerate(config) {
        try {
            logger_1.Logger.info('CommitComposerPanel: Generating commits', {
                provider: config.provider,
                model: config.model
            });
            // Use factory to create provider
            this.aiProvider = aiProviderFactory_1.AIProviderFactory.create(config.provider, {
                apiKey: config.apiKey,
                model: config.model
            });
            const changes = await this.gitService.getStagedChanges();
            if (changes.length === 0) {
                logger_1.Logger.warn('CommitComposerPanel: No staged changes to analyze');
                throw new Error('No staged changes to analyze');
            }
            logger_1.Logger.info('CommitComposerPanel: Analyzing changes with AI', { fileCount: changes.length });
            const result = await this.aiProvider.analyzeChanges(changes);
            logger_1.Logger.info('CommitComposerPanel: AI analysis complete', { groupCount: result.groups.length });
            this._panel.webview.postMessage({
                command: 'generated',
                groups: result.groups
            });
        }
        catch (e) {
            logger_1.Logger.error('CommitComposerPanel: Failed to generate commits', e);
            this._panel.webview.postMessage({
                command: 'error',
                message: e.message
            });
        }
    }
    async handleCommit(group) {
        try {
            logger_1.Logger.info('CommitComposerPanel: Creating commit', {
                message: group.message,
                fileCount: group.files.length
            });
            const files = group.files.map(f => f.path);
            await this.gitService.createCommit(group.message, files);
            logger_1.Logger.info('CommitComposerPanel: Commit created successfully');
            vscode.window.showInformationMessage(`Committed: ${group.message}`);
            await this.loadChanges(); // Refresh
        }
        catch (e) {
            logger_1.Logger.error('CommitComposerPanel: Failed to create commit', e);
            vscode.window.showErrorMessage(`Commit failed: ${e.message}`);
        }
    }
}
exports.CommitComposerPanel = CommitComposerPanel;
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=CommitComposerPanel.js.map