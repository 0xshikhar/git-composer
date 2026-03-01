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
const assert = __importStar(require("assert"));
const commitSplitter_1 = require("../../core/commit/commitSplitter");
const git_1 = require("../../types/git");
suite('CommitSplitter Test Suite', () => {
    test('should not split when file count is below threshold', () => {
        const files = [
            { path: 'src/components/Button.tsx', changeType: git_1.ChangeType.Modified, diff: '', additions: 10, deletions: 2 },
            { path: 'src/components/Input.tsx', changeType: git_1.ChangeType.Added, diff: '', additions: 5, deletions: 0 }
        ];
        const splitter = new commitSplitter_1.CommitSplitter(3); // Threshold is 3
        const clusters = splitter.split(files);
        assert.strictEqual(clusters.length, 1);
        assert.strictEqual(clusters[0].files.length, 2);
    });
    test('should split by domain when file count exceeds threshold', () => {
        const files = [
            { path: 'src/components/Button.tsx', changeType: git_1.ChangeType.Modified, diff: '', additions: 10, deletions: 2 },
            { path: 'src/components/Input.tsx', changeType: git_1.ChangeType.Added, diff: '', additions: 5, deletions: 0 },
            { path: 'src/api/auth.ts', changeType: git_1.ChangeType.Modified, diff: '', additions: 20, deletions: 0 },
            { path: 'package.json', changeType: git_1.ChangeType.Modified, diff: '', additions: 1, deletions: 1 }
        ];
        const splitter = new commitSplitter_1.CommitSplitter(1); // Threshold 1
        const clusters = splitter.split(files);
        // Expect separate clusters (e.g. ui, api, config)
        assert.ok(clusters.length > 1);
        // Find cluster that contains package.json
        const configCluster = clusters.find(c => c.files.some(f => f.path === 'package.json'));
        assert.ok(configCluster, 'Config cluster should be present');
    });
});
//# sourceMappingURL=commitSplitter.test.js.map