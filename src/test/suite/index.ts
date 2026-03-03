import * as path from 'path';
import Mocha = require('mocha');
import glob = require('glob');

/**
 * This module is used as the test suite entry point for @vscode/test-electron.
 * It also exports `run` so that runTest.ts can call it directly as a fallback
 * when VS Code cannot be downloaded (e.g., offline CI).
 */
export async function run(): Promise<void> {
    const mocha = new Mocha({ ui: 'tdd', color: true });
    const testsRoot = path.resolve(__dirname);

    const files = glob.sync('**/*.test.js', { cwd: testsRoot });
    files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

    return new Promise((resolve, reject) => {
        mocha.run((failures: number) => {
            if (failures > 0) {
                reject(new Error(`${failures} tests failed.`));
            } else {
                resolve();
            }
        });
    });
}
