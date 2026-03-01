import * as assert from 'assert';
import { CommitSplitter } from '../../core/commit/commitSplitter';
import { ChangeType, FileChange } from '../../types/git';

suite('CommitSplitter Test Suite', () => {
    test('should not split when file count is below threshold', () => {
        const files: FileChange[] = [
            { path: 'src/components/Button.tsx', changeType: ChangeType.Modified, diff: '', additions: 10, deletions: 2 },
            { path: 'src/components/Input.tsx', changeType: ChangeType.Added, diff: '', additions: 5, deletions: 0 }
        ];

        const splitter = new CommitSplitter(3); // Threshold is 3
        const clusters = splitter.split(files);

        assert.strictEqual(clusters.length, 1);
        assert.strictEqual(clusters[0].files.length, 2);
    });

    test('should split by domain when file count exceeds threshold', () => {
        const files: FileChange[] = [
            { path: 'src/components/Button.tsx', changeType: ChangeType.Modified, diff: '', additions: 10, deletions: 2 },
            { path: 'src/components/Input.tsx', changeType: ChangeType.Added, diff: '', additions: 5, deletions: 0 },
            { path: 'src/api/auth.ts', changeType: ChangeType.Modified, diff: '', additions: 20, deletions: 0 },
            { path: 'package.json', changeType: ChangeType.Modified, diff: '', additions: 1, deletions: 1 }
        ];

        const splitter = new CommitSplitter(1); // Threshold 1
        const clusters = splitter.split(files);

        // Expect separate clusters (e.g. ui, api, config)
        assert.ok(clusters.length > 1);

        // Find cluster that contains package.json
        const configCluster = clusters.find(c => c.files.some(f => f.path === 'package.json'));
        assert.ok(configCluster, 'Config cluster should be present');
    });
});
