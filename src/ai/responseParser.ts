import { AIResponse } from './aiProvider';
import { CommitGroup } from '../types/commits';
import { FileChange } from '../types/git';
import { v4 as uuidv4 } from 'uuid';

export class ResponseParser {
    static parseGroupingResponse(
        response: string,
        allChanges: FileChange[]
    ): AIResponse {
        try {
            // Try to extract JSON from markdown code blocks if present
            const jsonMatch = response.match(/`json\s*([\s\S]*?)\s*`/) ||
                response.match(/`\s*([\s\S]*?)\s*`/);

            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            const parsed = JSON.parse(jsonStr);

            const groups: CommitGroup[] = parsed.groups.map((group: any) => {
                const files = allChanges.filter(change =>
                    group.files.includes(change.path)
                );

                const message = this.formatConventionalCommit(
                    group.type,
                    group.scope,
                    group.subject,
                    group.body
                );

                return {
                    id: uuidv4(),
                    message: message,
                    description: group.body,
                    files: files,
                    confidence: group.confidence || 80
                };
            });

            return {
                groups,
                reasoning: parsed.reasoning
            };
        } catch (error) {
            throw new Error(
                `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    static parseMessageResponse(response: string): string {
        // Remove markdown code blocks if present
        const cleaned = response
            .replace(/```[\s\S]*?```/g, '')
            .trim();

        return cleaned;
    }

    private static formatConventionalCommit(
        type: string,
        scope: string | undefined,
        subject: string,
        body?: string
    ): string {
        let message = `${type}`;

        if (scope) {
            message += `(${scope})`;
        }

        message += `: ${subject}`;

        if (body) {
            message += `\n\n${body}`;
        }

        return message;
    }
}
