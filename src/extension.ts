import * as vscode from 'vscode';
import { GitService } from './git/gitService';
import { CommitComposerPanel } from './webview/CommitComposerPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('Commit Composer activated');

    // Initialize services
    // const gitService = new GitService(); // Will initialize when command calls to ensure workspace is ready logic if needed? 
    // Actually GitService constructor throws if no workspace. Better to do it lazily or inside command.

    // Register commands
    const autoComposeCommand = vscode.commands.registerCommand(
        'commitComposer.autoCompose',
        async () => {
            try {
                const gitService = new GitService();
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) {
                    vscode.window.showErrorMessage('No workspace folder open');
                    return;
                }

                const stagedResponse = await gitService.getStagedChanges();
                vscode.window.showInformationMessage(`Found ${stagedResponse.length} staged files.`);

                // Show panel
                CommitComposerPanel.createOrShow(context.extensionUri, gitService);

            } catch (error) {
                vscode.window.showErrorMessage(
                    `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        }
    );

    context.subscriptions.push(autoComposeCommand);
}

export function deactivate() { }
