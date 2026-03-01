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
const orchestrator_1 = require("../../core/orchestrator");
const gitService_1 = require("../../core/git/gitService");
const git_1 = require("../../types/git");
class MockGitService extends gitService_1.GitService {
    async getStagedChanges() {
        return [
            { path: 'src/test.ts', changeType: git_1.ChangeType.Modified, diff: 'dummy diff', additions: 1, deletions: 1 }
        ];
    }
    async getRepoContext() {
        return {
            repoName: 'test-repo',
            branch: 'main',
            recentCommits: ['feat: test'],
            projectType: 'TypeScript'
        };
    }
}
suite('Orchestrator Test Suite', () => {
    test('should compose commits with heuristics fallback', async () => {
        const mockGit = new MockGitService();
        const orchestrator = new orchestrator_1.Orchestrator(mockGit);
        // Don't pass provider config string so it uses heuristics
        const result = await orchestrator.compose();
        assert.ok(result.drafts);
        assert.strictEqual(result.drafts.length, 1);
        const draft = result.drafts[0];
        assert.strictEqual(draft.files.length, 1);
        assert.strictEqual(draft.files[0].path, 'src/test.ts');
        assert.strictEqual(draft.state, 'draft');
    });
});
//# sourceMappingURL=orchestrator.test.js.map