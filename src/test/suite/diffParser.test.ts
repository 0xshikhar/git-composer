import * as assert from 'assert';
import { DiffParser } from '../../core/parser/diffParser';
import { ChangeType } from '../../types/git';

suite('DiffParser Test Suite', () => {
    test('should parse unified diff correctly for modified file', () => {
        const dummyDiff = `diff --git a/test.ts b/test.ts
index e69de29..4b825dc 100644
--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,4 @@
 line1
-line2
+line2_changed
+line3
 line4`;

        const parsed = DiffParser.parse(dummyDiff);

        assert.strictEqual(parsed.files.length, 1);
        const fileDiff = parsed.files[0];

        assert.strictEqual(fileDiff.path, 'test.ts');
        assert.strictEqual(fileDiff.changeType, ChangeType.Modified);
        assert.strictEqual(fileDiff.hunks.length, 1);

        const hunk = fileDiff.hunks[0];
        assert.strictEqual(hunk.oldStart, 1);
        assert.strictEqual(hunk.oldLines, 3);
        assert.strictEqual(hunk.newStart, 1);
        assert.strictEqual(hunk.newLines, 4);

        assert.strictEqual(fileDiff.additions, 2);
        assert.strictEqual(fileDiff.deletions, 1);
    });

    test('should identify new file correctly', () => {
        const dummyDiff = `diff --git a/new.ts b/new.ts
new file mode 100644
index 0000000..e69de29
--- /dev/null
+++ b/new.ts
@@ -0,0 +1,1 @@
+newline`;
        const parsed = DiffParser.parse(dummyDiff);

        assert.strictEqual(parsed.files.length, 1);
        assert.strictEqual(parsed.files[0].path, 'new.ts');
        assert.strictEqual(parsed.files[0].changeType, ChangeType.Added);
        assert.strictEqual(parsed.files[0].additions, 1);
        assert.strictEqual(parsed.files[0].deletions, 0);
    });

    test('should identify deleted file correctly', () => {
        const dummyDiff = `diff --git a/old.ts b/old.ts
deleted file mode 100644
index e69de29..0000000
--- a/old.ts
+++ /dev/null
@@ -1,1 +0,0 @@
-oldline`;
        const parsed = DiffParser.parse(dummyDiff);

        assert.strictEqual(parsed.files.length, 1);
        assert.strictEqual(parsed.files[0].changeType, ChangeType.Deleted);
        assert.strictEqual(parsed.files[0].additions, 0);
        assert.strictEqual(parsed.files[0].deletions, 1);
    });
});
