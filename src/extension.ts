import * as vscode from 'vscode';
import { GitService } from './git/gitService';
import { CommitComposerPanel } from './webview/CommitComposerPanel';
import { Logger } from './utils/logger';

export function activate(context: vscode.ExtensionContext) {
    Logger.initialize();
    Logger.info('Git Commit Composer extension activated');
    console.log('Commit Composer activated');

    // Initialize services
    // const gitService = new GitService(); // Will initialize when command calls to ensure workspace is ready logic if needed? 
    // Actually GitService constructor throws if no workspace. Better to do it lazily or inside command.

    // Register commands
    const autoComposeCommand = vscode.commands.registerCommand(
        'commitComposer.autoCompose',
        async () => {
            try {
                Logger.info('Auto Compose command triggered');
                const gitService = new GitService();
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) {
                    Logger.warn('No workspace folder open');
                    vscode.window.showErrorMessage('No workspace folder open');
                    return;
                }

                Logger.info('Getting staged changes', { workspaceFolder: workspaceFolder.uri.fsPath });
                const stagedResponse = await gitService.getStagedChanges();
                Logger.info('Staged changes retrieved', { count: stagedResponse.length });
                vscode.window.showInformationMessage(`Found ${stagedResponse.length} staged files.`);

                // Show panel
                Logger.info('Opening Commit Composer panel');
                CommitComposerPanel.createOrShow(context.extensionUri, gitService);

            } catch (error) {
                Logger.error('Error in autoCompose command', error);
                vscode.window.showErrorMessage(
                    `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        }
    );

    context.subscriptions.push(autoComposeCommand);
    Logger.info('Commands registered successfully');
}

export function deactivate() {
    Logger.info('Git Commit Composer extension deactivated');
}
