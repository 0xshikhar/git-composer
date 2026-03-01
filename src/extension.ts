import * as vscode from 'vscode';
import { GitService } from './git/gitService';
import { CommitComposerProvider } from './webview/CommitComposerProvider';
import { Logger } from './utils/logger';

export function activate(context: vscode.ExtensionContext) {
    Logger.initialize();
    Logger.info('Git Commit Composer extension activated');
    console.log('Commit Composer activated');

    // Initialize services
    // const gitService = new GitService(); // Will initialize when command calls to ensure workspace is ready logic if needed? 
    // Actually GitService constructor throws if no workspace. Better to do it lazily or inside command.

    const gitService = new GitService();
    const provider = new CommitComposerProvider(context.extensionUri, gitService);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(CommitComposerProvider.viewType, provider)
    );

    // Keep the command to focus the view
    const autoComposeCommand = vscode.commands.registerCommand(
        'commitComposer.autoCompose',
        () => {
            vscode.commands.executeCommand('commitComposer.sidebarView.focus');
        }
    );

    context.subscriptions.push(autoComposeCommand);
    Logger.info('Commands registered successfully');
}

export function deactivate() {
    Logger.info('Git Commit Composer extension deactivated');
}
