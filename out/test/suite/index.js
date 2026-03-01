"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const path = __importStar(require("path"));
const Module = require("module");
const Mocha = require("mocha");
const glob = require("glob");
function installVscodeShim() {
    try {
        require.resolve('vscode');
        return;
    }
    catch {
        // Use a minimal shim when tests run directly in Node without an extension host.
    }
    const outputChannel = {
        name: 'Git Commit Composer',
        appendLine: (_value) => undefined,
        show: () => undefined,
        clear: () => undefined,
        hide: () => undefined,
        replace: (_value) => undefined,
        dispose: () => undefined
    };
    const mockVscode = {
        window: {
            createOutputChannel: (_name) => outputChannel
        },
        workspace: {
            workspaceFolders: [{ uri: { fsPath: process.cwd() } }],
            getConfiguration: () => ({
                get: (_section, defaultValue) => defaultValue
            })
        }
    };
    const moduleLoader = Module;
    const originalLoad = moduleLoader._load.bind(moduleLoader);
    moduleLoader._load = (request, parent, isMain) => {
        if (request === 'vscode') {
            return mockVscode;
        }
        return originalLoad(request, parent, isMain);
    };
}
async function run() {
    installVscodeShim();
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true
    });
    const testsRoot = path.resolve(__dirname, '..');
    const files = glob.sync('**/**.test.js', { cwd: testsRoot });
    // Add files to the test suite
    files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));
    return new Promise((c, e) => {
        try {
            // Run the mocha test
            mocha.run((failures) => {
                if (failures > 0) {
                    e(new Error(`${failures} tests failed.`));
                }
                else {
                    c();
                }
            });
        }
        catch (err) {
            console.error(err);
            e(err);
        }
    });
}
//# sourceMappingURL=index.js.map