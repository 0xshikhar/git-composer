"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiffParser = void 0;
const git_1 = require("../../types/git");
/**
 * Parses unified diff output into a structured AST.
 */
class DiffParser {
    /**
     * Parse a full multi-file diff string (e.g. `git diff --cached --patch`).
     */
    static parse(rawDiff) {
        if (!rawDiff.trim()) {
            return { files: [] };
        }
        const files = [];
        // Split by file diff headers
        const fileDiffs = rawDiff.split(/^diff --git /gm).filter(Boolean);
        for (const fileDiff of fileDiffs) {
            const parsed = this.parseFileDiff(fileDiff);
            if (parsed) {
                files.push(parsed);
            }
        }
        return { files };
    }
    /**
     * Parse a single file diff string.
     */
    static parseSingleFileDiff(rawDiff) {
        if (!rawDiff.trim())
            return null;
        // Check if it starts with "diff --git"
        const cleaned = rawDiff.replace(/^diff --git /, '');
        return this.parseFileDiff(cleaned);
    }
    static parseFileDiff(content) {
        const lines = content.split('\n');
        if (lines.length === 0)
            return null;
        // Extract file paths from first line: "a/path b/path"
        const headerLine = lines[0];
        const pathMatch = headerLine.match(/^a\/(.*?)\s+b\/(.*)/);
        if (!pathMatch)
            return null;
        const oldPath = pathMatch[1];
        const newPath = pathMatch[2];
        // Detect binary
        const isBinary = lines.some(l => l.startsWith('Binary files'));
        // Detect change type
        let changeType = git_1.ChangeType.Modified;
        if (lines.some(l => l.startsWith('new file mode'))) {
            changeType = git_1.ChangeType.Added;
        }
        else if (lines.some(l => l.startsWith('deleted file mode'))) {
            changeType = git_1.ChangeType.Deleted;
        }
        else if (oldPath !== newPath) {
            changeType = git_1.ChangeType.Renamed;
        }
        // Parse hunks
        const hunks = this.parseHunks(lines);
        let additions = 0;
        let deletions = 0;
        for (const hunk of hunks) {
            for (const line of hunk.lines) {
                if (line.type === 'add')
                    additions++;
                if (line.type === 'delete')
                    deletions++;
            }
        }
        return {
            path: newPath,
            oldPath: oldPath !== newPath ? oldPath : undefined,
            changeType,
            hunks,
            additions,
            deletions,
            isBinary,
        };
    }
    static parseHunks(lines) {
        const hunks = [];
        let currentHunk = null;
        let oldLine = 0;
        let newLine = 0;
        for (const line of lines) {
            // Match hunk header: @@ -old,count +new,count @@
            const hunkMatch = line.match(/^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@(.*)/);
            if (hunkMatch) {
                if (currentHunk) {
                    hunks.push(currentHunk);
                }
                const oldStart = parseInt(hunkMatch[1], 10);
                const oldLines = parseInt(hunkMatch[2] ?? '1', 10);
                const newStart = parseInt(hunkMatch[3], 10);
                const newLines = parseInt(hunkMatch[4] ?? '1', 10);
                oldLine = oldStart;
                newLine = newStart;
                currentHunk = {
                    header: line,
                    oldStart,
                    oldLines,
                    newStart,
                    newLines,
                    lines: [],
                };
                continue;
            }
            if (!currentHunk)
                continue;
            if (line.startsWith('+')) {
                const diffLine = {
                    type: 'add',
                    content: line.substring(1),
                    newLineNumber: newLine++,
                };
                currentHunk.lines.push(diffLine);
            }
            else if (line.startsWith('-')) {
                const diffLine = {
                    type: 'delete',
                    content: line.substring(1),
                    oldLineNumber: oldLine++,
                };
                currentHunk.lines.push(diffLine);
            }
            else if (line.startsWith(' ')) {
                const diffLine = {
                    type: 'context',
                    content: line.substring(1),
                    oldLineNumber: oldLine++,
                    newLineNumber: newLine++,
                };
                currentHunk.lines.push(diffLine);
            }
        }
        if (currentHunk) {
            hunks.push(currentHunk);
        }
        return hunks;
    }
}
exports.DiffParser = DiffParser;
//# sourceMappingURL=diffParser.js.map