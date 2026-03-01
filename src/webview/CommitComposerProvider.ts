import * as vscode from 'vscode';
import { GitService } from '../git/gitService';
import { AIProviderFactory } from '../ai/aiProviderFactory';
import { AIProvider } from '../ai/aiProvider';
import { CommitGroup } from '../types/commits';
import { FileChange } from '../types/git';
import { Logger } from '../utils/logger';

export class CommitComposerProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'commitComposer.sidebarView';
    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;
    private gitService: GitService;
    private aiProvider: AIProvider | undefined;

    constructor(
        extensionUri: vscode.Uri,
        gitService: GitService
    ) {
        this._extensionUri = extensionUri;
        this.gitService = gitService;
        Logger.info('CommitComposerProvider: Initialized');
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
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

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <title>Git Composer</title>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }

    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            async (message) => {
                Logger.debug('CommitComposerProvider: Received message from webview', { command: message.command });

                switch (message.command) {
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
            }
        );
    }

    private async loadChanges() {
        if (!this._view) return;
        try {
            Logger.info('CommitComposerProvider: Loading staged changes');
            const staged = await this.gitService.getStagedChanges();
            Logger.info('CommitComposerProvider: Staged changes loaded', { count: staged.length });

            this._view.webview.postMessage({
                command: 'dataLoaded',
                data: { staged }
            });
        } catch (e) {
            Logger.error('CommitComposerProvider: Failed to load changes', e);
            this._view.webview.postMessage({
                command: 'error',
                message: (e as Error).message
            });
        }
    }

    private async handleGenerate(config: any) {
        if (!this._view) return;
        try {
            Logger.info('CommitComposerProvider: Generating commits', {
                provider: config.provider,
                model: config.model
            });

            this.aiProvider = AIProviderFactory.create(config.provider, {
                apiKey: config.apiKey,
                model: config.model
            });

            const changes = await this.gitService.getStagedChanges();
            if (changes.length === 0) {
                Logger.warn('CommitComposerProvider: No staged changes to analyze');
                throw new Error('No staged changes to analyze');
            }

            Logger.info('CommitComposerProvider: Analyzing changes with AI', { fileCount: changes.length });
            const result = await this.aiProvider.analyzeChanges(changes);
            Logger.info('CommitComposerProvider: AI analysis complete', { groupCount: result.groups.length });

            this._view.webview.postMessage({
                command: 'generated',
                groups: result.groups
            });

        } catch (e) {
            Logger.error('CommitComposerProvider: Failed to generate commits', e);
            this._view.webview.postMessage({
                command: 'error',
                message: (e as Error).message
            });
        }
    }

    private async handleCommit(group: CommitGroup) {
        if (!this._view) return;
        try {
            Logger.info('CommitComposerProvider: Creating commit', {
                message: group.message,
                fileCount: group.files.length
            });

            const files = group.files.map(f => f.path);
            await this.gitService.createCommit(group.message, files);

            Logger.info('CommitComposerProvider: Commit created successfully');
            vscode.window.showInformationMessage(`Committed: ${group.message}`);
            await this.loadChanges(); // Refresh
        } catch (e) {
            Logger.error('CommitComposerProvider: Failed to create commit', e);
            vscode.window.showErrorMessage(`Commit failed: ${(e as Error).message}`);
        }
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

}
