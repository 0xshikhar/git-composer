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
const diffParser_1 = require("../../core/parser/diffParser");
const git_1 = require("../../types/git");
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
        const parsed = diffParser_1.DiffParser.parse(dummyDiff);
        assert.strictEqual(parsed.files.length, 1);
        const fileDiff = parsed.files[0];
        assert.strictEqual(fileDiff.path, 'test.ts');
        assert.strictEqual(fileDiff.changeType, git_1.ChangeType.Modified);
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
        const parsed = diffParser_1.DiffParser.parse(dummyDiff);
        assert.strictEqual(parsed.files.length, 1);
        assert.strictEqual(parsed.files[0].path, 'new.ts');
        assert.strictEqual(parsed.files[0].changeType, git_1.ChangeType.Added);
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
        const parsed = diffParser_1.DiffParser.parse(dummyDiff);
        assert.strictEqual(parsed.files.length, 1);
        assert.strictEqual(parsed.files[0].changeType, git_1.ChangeType.Deleted);
        assert.strictEqual(parsed.files[0].additions, 0);
        assert.strictEqual(parsed.files[0].deletions, 1);
    });
});
//# sourceMappingURL=diffParser.test.js.map