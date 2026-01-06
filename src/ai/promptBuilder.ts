import { FileChange } from '../types/git';

export class PromptBuilder {
    static buildGroupingPrompt(changes: FileChange[]): string {
        const filesInfo = changes.map(change => {
            // Truncate large diffs to save tokens
            const truncatedDiff = this.truncateDiff(change.diff, 100);

            return {
                path: change.path,
                type: change.changeType,
                additions: change.additions,
                deletions: change.deletions,
                diff: truncatedDiff
            };
        });

        return `Analyze these git changes and group them into logical commits.

Files changed:
${JSON.stringify(filesInfo, null, 2)}

Requirements:
1. Group related changes together (e.g., feature files, bug fixes, refactoring)
2. Keep commits focused and atomic
3. Separate unrelated changes
4. Follow conventional commit format
5. Consider file dependencies and relationships

Return a JSON object with this structure:
{
  "groups": [
    {
      "files": ["path1", "path2"],
      "type": "feat|fix|refactor|docs|style|test|chore",
      "scope": "optional scope",
      "subject": "short description",
      "body": "detailed explanation (optional)",
      "confidence": 0-100
    }
  ],
  "reasoning": "Explanation of grouping decisions"
}`;
    }

    static buildMessagePrompt(files: FileChange[]): string {
        const filesInfo = files.map(f => ({
            path: f.path,
            type: f.changeType,
            additions: f.additions,
            deletions: f.deletions,
            diff: this.truncateDiff(f.diff, 50)
        }));

        return `Generate a clear, conventional commit message for these changes:

${JSON.stringify(filesInfo, null, 2)}

Format: <type>(<scope>): <subject>

<body>

Where:
- type: feat, fix, refactor, docs, style, test, chore
- scope: optional, affected module/component
- subject: imperative mood, lowercase, no period
- body: optional, explain what and why (not how)

Return only the commit message, no JSON.`;
    }

    private static truncateDiff(diff: string, maxLines: number): string {
        const lines = diff.split('\n');
        if (lines.length <= maxLines) {
            return diff;
        }
        return lines.slice(0, maxLines).join('\n') + '\n... (truncated)';
    }

    static estimateTokens(text: string): number {
        // Rough estimation: ~4 characters per token
        return Math.ceil(text.length / 4);
    }
}
