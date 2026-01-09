import { AIResponse } from './aiProvider';
import { CommitGroup } from '../types/commits';
import { FileChange } from '../types/git';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';

export class ResponseParser {
    static parseGroupingResponse(
        response: string,
        allChanges: FileChange[]
    ): AIResponse {
        try {
            Logger.debug('Raw AI response received', { responseLength: response.length });
            Logger.debug('Raw AI response content', { response });

            // Try to extract JSON from markdown code blocks
            let jsonStr = response;

            // Check for ```json code blocks
            const jsonBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonBlockMatch) {
                jsonStr = jsonBlockMatch[1];
                Logger.debug('Extracted JSON from ```json block');
            } else {
                // Check for generic ``` code blocks
                const codeBlockMatch = response.match(/```\s*([\s\S]*?)\s*```/);
                if (codeBlockMatch) {
                    jsonStr = codeBlockMatch[1];
                    Logger.debug('Extracted JSON from ``` block');
                }
            }

            // Clean up the JSON string
            jsonStr = jsonStr.trim();
            Logger.debug('JSON string to parse', { jsonStr });

            const parsed = JSON.parse(jsonStr);
            Logger.debug('Successfully parsed JSON', { parsed });

            if (!parsed.groups || !Array.isArray(parsed.groups)) {
                throw new Error('Response does not contain a valid "groups" array');
            }

            const groups: CommitGroup[] = parsed.groups.map((group: any, index: number) => {
                Logger.debug(`Processing group ${index}`, { group });

                if (!group.files || !Array.isArray(group.files)) {
                    Logger.warn(`Group ${index} missing files array`, { group });
                    group.files = [];
                }

                const files = allChanges.filter(change =>
                    group.files.includes(change.path)
                );

                Logger.debug(`Matched ${files.length} files for group ${index}`, {
                    requestedFiles: group.files,
                    matchedFiles: files.map(f => f.path)
                });

                const message = this.formatConventionalCommit(
                    group.type || 'chore',
                    group.scope,
                    group.subject || 'Update files',
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

            Logger.info(`Successfully parsed ${groups.length} commit groups`);

            return {
                groups,
                reasoning: parsed.reasoning
            };
        } catch (error) {
            Logger.error('Failed to parse AI response', error);
            Logger.error('Response content that failed to parse', { response });
            throw new Error(
                `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    static parseMessageResponse(response: string): string {
        Logger.debug('Parsing message response', { response });

        // Remove markdown code blocks if present
        const cleaned = response
            .replace(/```[\s\S]*?```/g, '')
            .trim();

        Logger.debug('Cleaned message response', { cleaned });
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
