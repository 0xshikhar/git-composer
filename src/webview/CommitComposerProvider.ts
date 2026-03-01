import * as vscode from 'vscode';
import { GitService } from '../core/git/gitService';
import { Orchestrator } from '../core/orchestrator';
import { CommitExecutor } from '../core/commitExecutor';
import { DraftCommit } from '../types/commits';
import { Logger } from '../utils/logger';

export class CommitComposerProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'commitComposer.sidebarView';
    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;
    private orchestrator: Orchestrator;
    private commitExecutor: CommitExecutor;

    constructor(extensionUri: vscode.Uri, gitService: GitService) {
        this._extensionUri = extensionUri;
        this.orchestrator = new Orchestrator(gitService);
        this.commitExecutor = new CommitExecutor(gitService);
        Logger.info('CommitComposerProvider: Initialized');
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
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
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
                <title>Git Composer</title>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }

    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(async (message) => {
            Logger.debug('CommitComposerProvider: Message received', { command: message.command });

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

    private async loadChanges() {
        if (!this._view) return;
        try {
            const staged = await this.orchestrator.getStagedChanges();
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

    private async handleCompose(providerConfig: any) {
        if (!this._view) return;
        try {
            this._view.webview.postMessage({ command: 'composing' });

            const result = await this.orchestrator.compose(providerConfig);

            this._view.webview.postMessage({
                command: 'composed',
                drafts: result.drafts,
                reasoning: result.reasoning
            });
        } catch (e) {
            Logger.error('CommitComposerProvider: Compose failed', e);
            this._view.webview.postMessage({
                command: 'error',
                message: (e as Error).message
            });
        }
    }

    private async handleCommitSingle(draft: DraftCommit) {
        if (!this._view) return;
        try {
            await this.commitExecutor.executeSingle(draft);
            vscode.window.showInformationMessage(`Committed: ${draft.message.split('\n')[0]}`);
            this._view.webview.postMessage({ command: 'commitSuccess', draftId: draft.id });
            await this.loadChanges();
        } catch (e) {
            Logger.error('CommitComposerProvider: Commit failed', e);
            this._view.webview.postMessage({
                command: 'error',
                message: (e as Error).message
            });
        }
    }

    private async handleCommitAll(drafts: DraftCommit[]) {
        if (!this._view) return;
        try {
            const results = await this.commitExecutor.executeAll(drafts, (progress) => {
                this._view?.webview.postMessage({
                    command: 'commitProgress',
                    progress
                });
            });

            const successCount = results.filter(r => r.success).length;
            vscode.window.showInformationMessage(
                `Committed ${successCount}/${results.length} commits successfully.`
            );

            await this.loadChanges();
            this._view.webview.postMessage({ command: 'commitAllDone', results });
        } catch (e) {
            Logger.error('CommitComposerProvider: Commit all failed', e);
            this._view.webview.postMessage({
                command: 'error',
                message: (e as Error).message
            });
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
