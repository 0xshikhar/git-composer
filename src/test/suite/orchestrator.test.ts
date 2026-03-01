import * as assert from 'assert';
import { Orchestrator } from '../../core/orchestrator';
import { GitService } from '../../core/git/gitService';
import { ChangeType, FileChange, RepoContext } from '../../types/git';
import { DraftCommit } from '../../types/commits';

class MockGitService extends GitService {
    async getStagedChanges(): Promise<FileChange[]> {
        return [
            { path: 'src/test.ts', changeType: ChangeType.Modified, diff: 'dummy diff', additions: 1, deletions: 1 }
        ];
    }

    async getRepoContext(): Promise<RepoContext> {
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
        const orchestrator = new Orchestrator(mockGit);

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
