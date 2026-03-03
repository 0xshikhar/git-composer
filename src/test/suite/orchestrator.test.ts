import * as assert from 'assert';
import { CommitSplitter } from '../../core/commit/commitSplitter';
import { CommitExecutor } from '../../core/commitExecutor';
import { Orchestrator } from '../../core/orchestrator';
import { ChangeType, FileChange, RepoContext } from '../../types/git';
import { DraftCommit } from '../../types/commits';

// Minimal in-memory mock for GitService — doesn't import vscode at all
class StubGitService {
    async getStagedChanges(): Promise<FileChange[]> {
        return [
            {
                path: 'src/components/Button.tsx',
                changeType: ChangeType.Modified,
                diff: '--- a/Button.tsx\n+++ b/Button.tsx\n@@ -1,3 +1,4 @@\n line\n-old\n+new',
                additions: 1,
                deletions: 1
            }
        ];
    }

    async getRepoContext(): Promise<RepoContext> {
        return {
            repoName: 'mock-repo',
            branch: 'main',
            recentCommits: ['fix: previous fix'],
            projectType: 'TypeScript'
        };
    }

    // stubs for CommitExecutor
    async stageFiles(_files: string[]): Promise<void> { }
    async createCommit(_message: string, _files: string[]): Promise<void> { }
    async unstageAll(): Promise<void> { }
}

suite('Orchestrator Test Suite', () => {
    test('should produce draft commits via heuristic fallback (no AI)', async () => {
        // Orchestrator.constructor expects a GitService, we use a structural mock
        const mockGit = new StubGitService() as any;
        const orchestrator = new Orchestrator(mockGit);

        // No providerConfig → heuristic fallback
        const result = await orchestrator.compose();

        assert.ok(result.drafts, 'Should return drafts array');
        assert.ok(result.drafts.length > 0, 'Should have at least one draft');

        const draft = result.drafts[0];
        assert.ok(draft.id, 'Draft should have id');
        assert.ok(draft.message, 'Draft should have message');
        assert.ok(draft.files.length > 0, 'Draft should include files');
        assert.strictEqual(draft.state, 'draft', "State should be 'draft'");
        assert.strictEqual(draft.files[0].path, 'src/components/Button.tsx');
    });

    test('should throw when there are no staged changes', async () => {
        const emptyStagedGit = {
            getStagedChanges: async () => [],
            getRepoContext: async () => ({
                repoName: 'mock', branch: 'main', recentCommits: [], projectType: 'node'
            }),
            stageFiles: async () => { },
            createCommit: async () => { },
            unstageAll: async () => { },
        } as any;

        const orchestrator = new Orchestrator(emptyStagedGit);
        await assert.rejects(
            () => orchestrator.compose(),
            /No staged changes/,
            'Should throw when there are no staged changes'
        );
    });
});
