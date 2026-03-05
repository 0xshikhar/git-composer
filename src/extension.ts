import * as vscode from 'vscode';
import { CommitComposerProvider } from './webview/CommitComposerProvider';
import { Logger } from './utils/logger';

export function activate(context: vscode.ExtensionContext) {
    Logger.initialize();
    Logger.info('OpenGit Composer v2 extension activated');

    const provider = new CommitComposerProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(CommitComposerProvider.viewType, provider)
    );

    const autoComposeCommand = vscode.commands.registerCommand(
        'commitComposer.autoCompose',
        async () => {
            await vscode.commands.executeCommand('workbench.view.extension.commitComposerContainer');
            await vscode.commands.executeCommand('commitComposer.sidebarView.focus');
        }
    );

    context.subscriptions.push(autoComposeCommand);
    Logger.info('OpenGit Composer v2 commands registered');
}

export function deactivate() {
    Logger.info('OpenGit Composer v2 extension deactivated');
}
