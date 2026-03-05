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
                } else {
                    // Try to find any JSON object in the response
                    const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
                    if (jsonObjectMatch) {
                        jsonStr = jsonObjectMatch[0];
                        Logger.debug('Extracted JSON object from response');
                    }
                }
            }

            // Clean up the JSON string - remove any leading/trailing non-JSON content
            jsonStr = jsonStr.trim();
            
            // Handle cases where AI returns just the array without wrapper
            if (jsonStr.startsWith('[')) {
                jsonStr = `{"groups": ${jsonStr}}`;
            }
            
            Logger.debug('JSON string to parse', { jsonStr: jsonStr.substring(0, 500) });

            const parsed = JSON.parse(jsonStr);
            Logger.debug('Successfully parsed JSON', { parsed });

            if (!parsed.groups || !Array.isArray(parsed.groups)) {
                // If still no groups, try to create groups from whatever we have
                if (parsed.commits || parsed.results || parsed.items) {
                    parsed.groups = parsed.commits || parsed.results || parsed.items;
                } else {
                    throw new Error('Response does not contain a valid "groups" array');
                }
            }

            const groups: CommitGroup[] = parsed.groups.map((group: any, index: number) => {
                Logger.debug(`Processing group ${index}`, { group });

                // Handle various file reference formats
                let files: FileChange[] = [];
                
                if (group.files && Array.isArray(group.files)) {
                    // Files might be strings (paths) or objects
                    if (group.files.length > 0 && typeof group.files[0] === 'string') {
                        files = allChanges.filter(change =>
                            group.files.includes(change.path)
                        );
                    } else if (group.files.length > 0 && typeof group.files[0] === 'object') {
                        // Files might be objects with path property
                        const filePaths = group.files.map((f: any) => f.path || f.file || f.name).filter(Boolean);
                        files = allChanges.filter(change =>
                            filePaths.includes(change.path)
                        );
                    }
                }

                // If no files matched but we have file names in the response, try partial matching
                if (files.length === 0 && group.files && Array.isArray(group.files)) {
                    const fileNames = group.files.map((f: any) => {
                        if (typeof f === 'string') return f;
                        return f.path || f.file || f.name;
                    }).filter(Boolean);
                    
                    files = allChanges.filter(change =>
                        fileNames.some((name: string) => change.path.includes(name) || name.includes(change.path.split('/').pop() || ''))
                    );
                }

                Logger.debug(`Matched ${files.length} files for group ${index}`, {
                    requestedFiles: group.files,
                    matchedFiles: files.map(f => f.path)
                });

                // If still no files matched, try to assign based on similar path patterns
                if (files.length === 0 && group.files && Array.isArray(group.files)) {
                    Logger.warn(`Group ${index}: No files matched, checking path patterns`);
                }

                const type = group.type || group.commitType || 'chore';
                const scope = group.scope || group.component;
                const subject = group.subject || group.message || group.title || 'Update files';
                const body = group.body || group.description || group.details;
                const confidence = group.confidence || group.score || 75;

                const message = this.formatConventionalCommit(
                    type,
                    scope,
                    subject,
                    body
                );

                return {
                    id: group.id || uuidv4(),
                    message: message,
                    description: body,
                    files: files,
                    confidence: typeof confidence === 'number' ? confidence : 75
                };
            });

            // Filter out groups with no files if we have at least one valid group
            const validGroups = groups.filter(g => g.files.length > 0);
            if (validGroups.length === 0 && groups.length > 0) {
                Logger.warn('All groups have empty files, returning original groups');
            }

            Logger.info(`Successfully parsed ${validGroups.length} commit groups`);

            return {
                groups: validGroups.length > 0 ? validGroups : groups,
                reasoning: parsed.reasoning || parsed.explanation || parsed.thinking
            };
        } catch (error) {
            Logger.error('Failed to parse AI response', error);
            Logger.error('Response content that failed to parse', { response });
            throw new Error(
                `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure your API key is valid and you have staged changes.`
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
