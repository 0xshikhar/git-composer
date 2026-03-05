import * as path from 'path';
import { runTests } from '@vscode/test-electron';
import { run as runSuite } from './suite/index';

function isDownloadNetworkError(err: unknown): boolean {
    if (err == null || typeof err !== 'object') return false;

    const maybeErr = err as NodeJS.ErrnoException;
    const code = maybeErr.code ?? '';
    const hostname = (maybeErr as { hostname?: string }).hostname ?? '';
    const networkCodes = new Set(['ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED']);

    return networkCodes.has(code) || hostname.includes('update.code.visualstudio.com');
}

function isRuntimeLaunchError(err: unknown): boolean {
    if (err == null || typeof err !== 'object') return false;

    const maybeErr = err as { code?: number; message?: string };
    const code = maybeErr.code ?? -1;
    const message = maybeErr.message ?? '';

    return (
        code === 9 ||
        /bad option: --disable-extensions/.test(message) ||
        /Test run failed with code 9/.test(message)
    );
}

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');

        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        // Download VS Code, unzip it and run the integration test.
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: ['--disable-extensions']
        });
    } catch (err) {
        if (isDownloadNetworkError(err) || isRuntimeLaunchError(err)) {
            console.warn('VS Code integration runtime unavailable; running local mocha suite only.', err);
            await runSuite();
            return;
        }

        console.error('Failed to run tests', err);
        process.exit(1);
    }
}

main();
