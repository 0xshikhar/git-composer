import * as vscode from 'vscode';
import { GitService } from '../core/git/gitService';
import { Orchestrator, ComposeProviderConfig } from '../core/orchestrator';
import { Orchestrator, ComposeProviderConfig } from '../core/orchestrator';
import { CommitExecutor } from '../core/commitExecutor';
import { ConfigLoader } from '../core/configLoader';
import { DraftCommit } from '../types/commits';
import { Logger } from '../utils/logger';

export class CommitComposerProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'commitComposer.sidebarView';
    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;
    private _orchestrator?: Orchestrator;
    private _commitExecutor?: CommitExecutor;
    private _configLoader?: ConfigLoader;

    constructor(extensionUri: vscode.Uri, keyManager?: KeyManager) {
        this._extensionUri = extensionUri;
        this._keyManager = keyManager;
        Logger.info('CommitComposerProvider: Initialized');
    }

    public setKeyManager(keyManager: KeyManager) {
        this._keyManager = keyManager;
    }

    private getOrchestrator(): Orchestrator {
        if (!this._orchestrator) {
            this._orchestrator = new Orchestrator(new GitService());
        }
        return this._orchestrator;
    }

    private getCommitExecutor(): CommitExecutor {
        if (!this._commitExecutor) {
            this._commitExecutor = new CommitExecutor(new GitService());
        }
        return this._commitExecutor;
    }

    private getConfigLoader(): ConfigLoader {
        if (!this._configLoader) {
            this._configLoader = new ConfigLoader();
        }
        return this._configLoader;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        Logger.info('CommitComposerProvider: resolveWebviewView called');

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'dist'),
                vscode.Uri.joinPath(this._extensionUri, 'media')
            ]
        };

        this._view = webviewView;

        webviewView.onDidChangeVisibility(() => {
            Logger.info('CommitComposerProvider: Visibility changed', { visible: webviewView.visible });
            if (webviewView.visible) {
                void this.loadChanges();
            }
        });

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        Logger.info('CommitComposerProvider: HTML set');

        this._setWebviewMessageListener(webviewView.webview);
        if (webviewView.visible) {
            void this.loadChanges();
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
        );
        const nonce = getNonce();
        const cspSource = webview.cspSource;

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${cspSource} data:; img-src ${cspSource} data: https:;">
                <title>OpenGit Composer</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        background-color: #1e1e1e;
                        color: #cccccc;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }
                    .gc-loading { 
                        display: flex; 
                        flex-direction: column;
                        align-items: center; 
                        justify-content: center; 
                        height: 100vh; 
                        gap: 12px;
                    }
                    .gc-loading-spinner {
                        width: 24px;
                        height: 24px;
                        border: 2px solid #3a3d41;
                        border-top-color: #007acc;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                    .gc-error {
                        padding: 16px;
                        color: #f85149;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div id="root">
                    <div class="gc-loading">
                        <div class="gc-loading-spinner"></div>
                        <span>Loading OpenGit Composer...</span>
                    </div>
                </div>
                <script nonce="${nonce}">
                    window.onerror = function(msg, url, line, col, error) {
                        const root = document.getElementById('root');
                        if (root) {
                            const details = String(msg || 'Unknown error');
                            root.innerHTML = '<div class="gc-error">Error loading: ' + details + '<br>Line: ' + (line || 'unknown') + '</div>';
                        }
                    };
                </script>
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

                case 'loadKeys':
                    await this.handleLoadKeys(message.provider, webview);
                    break;

                case 'saveKey':
                    await this.handleSaveKey(message.provider, message.key, message.label, webview);
                    break;

                case 'removeKey':
                    await this.handleRemoveKey(message.provider, message.keyIndex, webview);
                    break;

                case 'resetKeys':
                    await this.handleResetKeys(message.provider, webview);
                    break;

                case 'compose':
                    await this.handleComposeWithKeyRotation(message.providerConfig);
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

                default:
                    Logger.warn('CommitComposerProvider: Unknown message command', { command: message.command });
                    break;

                default:
                    Logger.warn('CommitComposerProvider: Unknown message command', { command: message.command });
                    break;
            }
        });
    }

    private async loadChanges() {
        if (!this._view) {
            Logger.warn('CommitComposerProvider: loadChanges called but view is undefined');
            return;
        }
        try {
            Logger.info('CommitComposerProvider: Loading staged changes...');
            const staged = await this.getOrchestrator().getStagedChanges();
            const config = this.getConfigLoader().getConfig();
            const providerConfig = {
                provider: config.provider,
                model: config.model,
                ...(config.baseUrl ? { baseUrl: config.baseUrl } : {}),
                ...(config.provider === 'ollama' && !config.baseUrl ? { baseUrl: config.ollamaHost } : {})
            };
            Logger.info('CommitComposerProvider: Staged changes loaded', { count: staged.length });

            const sent = await this._view.webview.postMessage({
                command: 'dataLoaded',
                data: { staged, providerConfig }
            });
            Logger.info('CommitComposerProvider: Message sent to webview', { success: sent });
        } catch (e) {
            Logger.error('CommitComposerProvider: Failed to load changes', e);
            try {
                this._view.webview.postMessage({
                    command: 'error',
                    message: (e as Error).message
                });
            } catch (postError) {
                Logger.error('CommitComposerProvider: Failed to send error message', postError);
            }
        }
    }

    private async handleCompose(providerConfig?: ComposeProviderConfig) {
        if (!this._view) return;
        try {
            this._view.webview.postMessage({ command: 'composing' });

            const result = await this.getOrchestrator().compose(providerConfig);

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
            await this.getCommitExecutor().executeSingle(draft);
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
            const results = await this.getCommitExecutor().executeAll(drafts, (progress) => {
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
