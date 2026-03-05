type OutputChannel = { appendLine(val: string): void; show(): void };

/**
 * Logger that works in both VS Code extension context and plain Node.js (tests).
 * It lazy-requires vscode so it doesn't crash when running unit tests without VS Code.
 */
export class Logger {
    private static outputChannel: OutputChannel | null = null;

    static initialize() {
        if (this.outputChannel) return;
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const vscode = require('vscode');
            this.outputChannel = vscode.window.createOutputChannel('OpenGit Composer');
        } catch {
            // In a pure Node.js / test context vscode does not exist — use a console shim
            this.outputChannel = {
                appendLine: (val: string) => console.log(val),
                show: () => { },
            };
        }
    }

    static info(message: string, data?: any) {
        this.initialize();
        const msg = `[INFO  ${ts()}] ${message}`;
        this.outputChannel!.appendLine(msg);
        if (data) this.outputChannel!.appendLine(JSON.stringify(data, null, 2));
        console.log(msg, data ?? '');
    }

    static error(message: string, error?: any) {
        this.initialize();
        const msg = `[ERROR ${ts()}] ${message}`;
        this.outputChannel!.appendLine(msg);
        if (error instanceof Error) {
            this.outputChannel!.appendLine(`Error: ${error.message}`);
            this.outputChannel!.appendLine(`Stack: ${error.stack || ''}`);
        } else if (error) {
            this.outputChannel!.appendLine(JSON.stringify(error, null, 2));
        }
        console.error(msg, error ?? '');
    }

    static debug(message: string, data?: any) {
        this.initialize();
        const msg = `[DEBUG ${ts()}] ${message}`;
        this.outputChannel!.appendLine(msg);
        if (data) this.outputChannel!.appendLine(JSON.stringify(data, null, 2));
        console.debug(msg, data ?? '');
    }

    static warn(message: string, data?: any) {
        this.initialize();
        const msg = `[WARN  ${ts()}] ${message}`;
        this.outputChannel!.appendLine(msg);
        if (data) this.outputChannel!.appendLine(JSON.stringify(data, null, 2));
        console.warn(msg, data ?? '');
    }

    static show() {
        this.initialize();
        this.outputChannel!.show();
    }
}

function ts() {
    return new Date().toISOString();
}
