import * as vscode from 'vscode';
import { GitService } from './core/git/gitService';
import { CommitComposerProvider } from './webview/CommitComposerProvider';
import { Logger } from './utils/logger';

export function activate(context: vscode.ExtensionContext) {
    Logger.initialize();
    Logger.info('Git Composer v2 extension activated');

    const provider = new CommitComposerProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(CommitComposerProvider.viewType, provider)
    );

    const autoComposeCommand = vscode.commands.registerCommand(
        'commitComposer.autoCompose',
        () => {
            vscode.commands.executeCommand('commitComposer.sidebarView.focus');
        }
    );

    context.subscriptions.push(autoComposeCommand);
    Logger.info('Git Composer v2 commands registered');
}

export function deactivate() {
    Logger.info('Git Composer v2 extension deactivated');
}
