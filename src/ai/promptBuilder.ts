import { FileChange, RepoContext } from '../types/git';

export class PromptBuilder {
    static buildGroupingPrompt(changes: FileChange[], context?: RepoContext): string {
        const filesInfo = changes.map(change => {
            const truncatedDiff = this.truncateDiff(change.diff, 80);
            return {
                path: change.path,
                type: change.changeType,
                additions: change.additions,
                deletions: change.deletions,
                diff: truncatedDiff
            };
        });

        let contextBlock = '';
        if (context) {
            contextBlock = `
Repository Context:
- Repository: ${context.repoName}
- Branch: ${context.branch}
- Project Type: ${context.projectType}
- Recent Commits:
${context.recentCommits.slice(0, 5).map(c => `  - ${c}`).join('\n')}

`;
        }

        return `You are an expert at organizing git changes into logical commits. Analyze the following staged changes and group them into semantic commits.

${contextBlock}
Files changed:
${JSON.stringify(filesInfo)}

IMPORTANT: You MUST respond with ONLY valid JSON. No explanations, no markdown, no text before or after. Start your response with { and end with }.

Required JSON format:
{
  "groups": [
    {
      "files1.txt", "file2": ["file.js"],
      "type": "feat",
      "scope": "optional-scope",
      "subject": "short description",
      "body": "optional detailed explanation",
      "confidence": 85
    }
  ],
  "reasoning": "brief explanation of grouping decisions"
}

Rules:
1. Each file path must exactly match one of: ${changes.map(c => `"${c.path}"`).join(', ')}
2. Use conventional commit types: feat, fix, refactor, docs, style, test, chore, perf, ci, build
3. confidence is 0-100
4. Keep subject under 72 characters
5. Do not omit any files - each file must be in exactly one group
6. Your response must be valid, parseable JSON
7. Do NOT use markdown code blocks - return raw JSON only`;
    }

    static buildMessagePrompt(files: FileChange[], context?: RepoContext): string {
        const filesInfo = files.map(f => ({
            path: f.path,
            type: f.changeType,
            additions: f.additions,
            deletions: f.deletions,
            diff: this.truncateDiff(f.diff, 50)
        }));

        let contextBlock = '';
        if (context) {
            contextBlock = `\nRepository: ${context.repoName} | Branch: ${context.branch}\n`;
        }

        return `Generate a clear, conventional commit message for these changes:
${contextBlock}
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
        return Math.ceil(text.length / 4);
    }
}
