import * as path from 'path';
import Module = require('module');
import Mocha = require('mocha');
import glob = require('glob');

type ModuleLoader = {
    _load: (request: string, parent: NodeModule | null, isMain: boolean) => unknown;
};

function installVscodeShim(): void {
    try {
        require.resolve('vscode');
        return;
    } catch {
        // Use a minimal shim when tests run directly in Node without an extension host.
    }

    const outputChannel = {
        name: 'Git Commit Composer',
        appendLine: (_value: string): void => undefined,
        show: (): void => undefined,
        clear: (): void => undefined,
        hide: (): void => undefined,
        replace: (_value: string): void => undefined,
        dispose: (): void => undefined
    };

    const mockVscode = {
        window: {
            createOutputChannel: (_name: string) => outputChannel
        },
        workspace: {
            workspaceFolders: [{ uri: { fsPath: process.cwd() } }],
            getConfiguration: () => ({
                get: <T>(_section: string, defaultValue?: T): T | undefined => defaultValue
            })
        }
    };

    const moduleLoader = Module as unknown as ModuleLoader;
    const originalLoad = moduleLoader._load.bind(moduleLoader);
    moduleLoader._load = (request: string, parent: NodeModule | null, isMain: boolean): unknown => {
        if (request === 'vscode') {
            return mockVscode;
        }
        return originalLoad(request, parent, isMain);
    };
}

export async function run(): Promise<void> {
    installVscodeShim();

    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true
    });

    const testsRoot = path.resolve(__dirname, '..');

    const files = glob.sync('**/**.test.js', { cwd: testsRoot });

    // Add files to the test suite
    files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

    return new Promise((c, e) => {
        try {
            // Run the mocha test
            mocha.run((failures: number) => {
                if (failures > 0) {
                    e(new Error(`${failures} tests failed.`));
                } else {
                    c();
                }
            });
        } catch (err) {
            console.error(err);
            e(err);
        }
    });
}
