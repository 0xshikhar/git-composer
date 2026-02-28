import * as vscode from 'vscode';

export class Logger {
    private static outputChannel: vscode.OutputChannel;

    static initialize() {
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('Git Commit Composer');
        }
    }

    static info(message: string, data?: any) {
        this.initialize();
        const timestamp = new Date().toISOString();
        const logMessage = `[INFO ${timestamp}] ${message}`;
        this.outputChannel.appendLine(logMessage);
        if (data) {
            this.outputChannel.appendLine(JSON.stringify(data, null, 2));
        }
        console.log(logMessage, data);
    }

    static error(message: string, error?: any) {
        this.initialize();
        const timestamp = new Date().toISOString();
        const logMessage = `[ERROR ${timestamp}] ${message}`;
        this.outputChannel.appendLine(logMessage);
        if (error) {
            if (error instanceof Error) {
                this.outputChannel.appendLine(`Error: ${error.message}`);
                this.outputChannel.appendLine(`Stack: ${error.stack}`);
            } else {
                this.outputChannel.appendLine(JSON.stringify(error, null, 2));
            }
        }
        console.error(logMessage, error);
    }

    static debug(message: string, data?: any) {
        this.initialize();
        const timestamp = new Date().toISOString();
        const logMessage = `[DEBUG ${timestamp}] ${message}`;
        this.outputChannel.appendLine(logMessage);
        if (data) {
            this.outputChannel.appendLine(JSON.stringify(data, null, 2));
        }
        console.debug(logMessage, data);
    }

    static warn(message: string, data?: any) {
        this.initialize();
        const timestamp = new Date().toISOString();
        const logMessage = `[WARN ${timestamp}] ${message}`;
        this.outputChannel.appendLine(logMessage);
        if (data) {
            this.outputChannel.appendLine(JSON.stringify(data, null, 2));
        }
        console.warn(logMessage, data);
    }

    static show() {
        this.initialize();
        this.outputChannel.show();
    }
}
