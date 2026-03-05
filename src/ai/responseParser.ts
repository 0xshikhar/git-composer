import { AIResponse } from './aiProvider';
import { CommitGroup } from '../types/commits';
import { FileChange } from '../types/git';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';

interface ParsedGroup {
    files: string[];
    type: string;
    scope?: string;
    subject: string;
    body?: string;
    confidence: number;
}

export class ResponseParser {
    static parseGroupingResponse(
        response: string,
        allChanges: FileChange[]
    ): AIResponse {
        Logger.debug('Raw AI response', { response: response.substring(0, 1000) });

        // Try multiple parsing strategies
        let groups: ParsedGroup[] = [];

        // Strategy 1: Try standard JSON parse
        try {
            groups = this.tryJsonParse(response);
            if (groups.length > 0) {
                Logger.info('Parsed using JSON strategy');
                return this.buildResponse(groups, allChanges, response);
            }
        } catch (e) {
            Logger.debug('JSON parse failed, trying text extraction');
        }

        // Strategy 2: Extract from text using regex patterns
        try {
            groups = this.extractFromText(response, allChanges);
            if (groups.length > 0) {
                Logger.info('Parsed using text extraction strategy');
                return this.buildResponse(groups, allChanges, response);
            }
        } catch (e) {
            Logger.debug('Text extraction failed');
        }

        // Strategy 3: Fallback - heuristic grouping
        Logger.info('Using heuristic fallback grouping');
        return this.fallbackHeuristicGrouping(allChanges);
    }

    private static tryJsonParse(response: string): ParsedGroup[] {
        let jsonStr = response.trim();
        
        // Remove markdown code blocks
        jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*$/gm, '');
        jsonStr = jsonStr.replace(/^```\s*/gm, '').replace(/```\s*$/gm, '');
        
        // Find JSON object
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        // Fix common issues
        jsonStr = this.aggressiveJsonFix(jsonStr);

        const parsed = JSON.parse(jsonStr);
        
        // Extract groups from various structures
        const groupsArray = parsed.groups || parsed.commits || parsed.results || parsed.items || parsed.data || [];
        
        if (!Array.isArray(groupsArray)) {
            return [];
        }

        return groupsArray.map((g: any) => ({
            files: this.extractFilePaths(g.files || g.file || g.paths || []),
            type: (g.type || g.commitType || 'chore').toLowerCase(),
            scope: g.scope || g.component,
            subject: g.subject || g.message || g.title || 'update files',
            body: g.body || g.description || g.details,
            confidence: typeof g.confidence === 'number' ? g.confidence : 
                       typeof g.score === 'number' ? g.score : 75
        }));
    }

    private static extractFilePaths(filesData: any): string[] {
        if (!filesData) return [];
        if (typeof filesData === 'string') return [filesData];
        if (!Array.isArray(filesData)) return [];
        
        return filesData.map((f: any) => {
            if (typeof f === 'string') return f;
            return f?.path || f?.file || f?.name || f?.filename || '';
        }).filter(Boolean);
    }

    private static aggressiveJsonFix(jsonStr: string): string {
        // Remove any text before first { or [
        const firstBrace = jsonStr.indexOf('{');
        const firstBracket = jsonStr.indexOf('[');
        let start = -1;
        if (firstBrace !== -1 && firstBracket !== -1) {
            start = Math.min(firstBrace, firstBracket);
        } else if (firstBrace !== -1) {
            start = firstBrace;
        } else if (firstBracket !== -1) {
            start = firstBracket;
        }
        
        if (start > 0) {
            jsonStr = jsonStr.substring(start);
        }

        // Fix common issues
        jsonStr = jsonStr
            .replace(/,\s*([}\]])/g, '$1')  // trailing commas
            .replace(/'/g, '"')  // single quotes
            .replace(/,\s*}/g, '}')  // comma before }
            .replace(/,\s*\]/g, ']');  // comma before ]

        // Try to balance braces
        const opens = (jsonStr.match(/\{/g) || []).length;
        const closes = (jsonStr.match(/\}/g) || []).length;
        if (opens > closes) {
            jsonStr += '}'.repeat(opens - closes);
        }

        return jsonStr;
    }

    private static extractFromText(response: string, allChanges: FileChange[]): ParsedGroup[] {
        const groups: ParsedGroup[] = [];
        const allFileNames = allChanges.map(f => f.path);
        
        // Pattern 1: Look for numbered groups with files listed
        const groupPatterns = [
            /(?:group|commit)[\s#]*\d+[:\)]?\s*([^:]+):\s*([^\n]+)/gi,
            /\{[^}]*"files"[^}]*\[[^\]]*\][^}]*\}/gi,
            /"type"\s*:\s*"([^"]+)"[^}]*"subject"\s*:\s*"([^"]+)"/gi,
        ];

        // Extract file mentions from response
        const mentionedFiles: string[] = [];
        for (const file of allFileNames) {
            const fileName = file.split('/').pop() || '';
            if (response.toLowerCase().includes(fileName.toLowerCase()) || 
                response.toLowerCase().includes(file.toLowerCase())) {
                mentionedFiles.push(file);
            }
        }

        // Try to find structured commit-like patterns
        const lines = response.split('\n');
        let currentGroup: ParsedGroup | null = null;

        for (const line of lines) {
            // Check for commit type patterns
            const typeMatch = line.match(/(feat|fix|refactor|docs|style|test|chore|perf|ci|build)(\s*\((\w+)\))?\s*:\s*(.+)/i);
            
            if (typeMatch) {
                if (currentGroup) {
                    groups.push(currentGroup);
                }
                
                // Find files mentioned near this commit
                const groupFiles = mentionedFiles.filter(f => 
                    line.toLowerCase().includes(f.split('/').pop()?.toLowerCase() || '')
                );

                currentGroup = {
                    files: groupFiles.length > 0 ? groupFiles : [],
                    type: typeMatch[1].toLowerCase(),
                    scope: typeMatch[3],
                    subject: typeMatch[4].trim(),
                    confidence: 70
                };
            }
        }

        if (currentGroup) {
            groups.push(currentGroup);
        }

        // If we found groups but no files were matched, distribute all files
        if (groups.length > 0 && groups.every(g => g.files.length === 0)) {
            const filesPerGroup = Math.ceil(allChanges.length / groups.length);
            groups.forEach((g, i) => {
                g.files = allChanges.slice(i * filesPerGroup, (i + 1) * filesPerGroup).map(f => f.path);
            });
        }

        return groups;
    }

    private static fallbackHeuristicGrouping(allChanges: FileChange[]): AIResponse {
        Logger.info('Using fallback heuristic grouping');
        
        // Simple heuristic: group by file type/location
        const groups: ParsedGroup[] = [];
        
        if (allChanges.length === 0) {
            return { groups: [], reasoning: 'No changes to group' };
        }

        // If only 1-2 files, put them in one group
        if (allChanges.length <= 2) {
            groups.push({
                files: allChanges.map(f => f.path),
                type: 'chore',
                subject: 'update changes',
                confidence: 80
            });
        } else {
            // Group by common paths
            const pathParts = allChanges.map(f => f.path.split('/'));
            const commonPrefix = this.findCommonPrefix(pathParts);
            
            // Check if files are in different directories
            const directories = new Set(pathParts.map(p => p[0]));
            
            if (directories.size > 1) {
                // Group by first directory level
                const byDir = new Map<string, FileChange[]>();
                for (const change of allChanges) {
                    const dir = change.path.split('/')[0];
                    if (!byDir.has(dir)) {
                        byDir.set(dir, []);
                    }
                    byDir.get(dir)!.push(change);
                }

                byDir.forEach((files, dir) => {
                    groups.push({
                        files: files.map(f => f.path),
                        type: 'chore',
                        subject: `update ${dir} directory`,
                        confidence: 60
                    });
                });
            } else {
                // All in same directory, split by file type
                const byType = new Map<string, FileChange[]>();
                for (const change of allChanges) {
                    const ext = change.path.split('.').pop() || 'other';
                    const type = ['ts', 'tsx', 'js', 'jsx'].includes(ext) ? 'src' :
                                ['css', 'scss', 'less'].includes(ext) ? 'styles' :
                                ['json', 'yaml', 'yml', 'toml'].includes(ext) ? 'config' : 'other';
                    if (!byType.has(type)) {
                        byType.set(type, []);
                    }
                    byType.get(type)!.push(change);
                }

                byType.forEach((files, type) => {
                    groups.push({
                        files: files.map(f => f.path),
                        type: 'chore',
                        subject: `update ${type} files`,
                        confidence: 50
                    });
                });
            }
        }

        return this.buildResponse(groups, allChanges, 'Fallback heuristic grouping');
    }

    private static findCommonPrefix(paths: string[][]): string {
        if (paths.length === 0) return '';
        if (paths.length === 1) return paths[0][0] || '';

        let prefix: string[] = [];
        for (let i = 0; i < paths[0].length; i++) {
            const part = paths[0][i];
            if (paths.every(p => p[i] === part)) {
                prefix.push(part);
            } else {
                break;
            }
        }
        return prefix.join('/');
    }

    private static buildResponse(groups: ParsedGroup[], allChanges: FileChange[], rawResponse: string): AIResponse {
        // Match files to groups
        const commitGroups: CommitGroup[] = groups.map((g, idx) => {
            // Try to match files
            let matchedFiles = allChanges.filter(change => {
                return g.files.some(fp => {
                    const fpLower = fp.toLowerCase();
                    const changePathLower = change.path.toLowerCase();
                    const fileName = change.path.split('/').pop()?.toLowerCase() || '';
                    return changePathLower === fpLower ||
                           changePathLower.endsWith(fpLower) ||
                           fpLower.endsWith(fileName) ||
                           fileName === fpLower ||
                           fileName.startsWith(fpLower.replace(/\.[^.]+$/, ''));
                });
            });

            // If no files matched, distribute remaining
            const assignedPaths = new Set(matchedFiles.map(f => f.path));
            const unassigned = allChanges.filter(f => !assignedPaths.has(f.path));
            
            if (matchedFiles.length === 0 && unassigned.length > 0) {
                const filesPerGroup = Math.ceil(unassigned.length / (groups.length - idx));
                matchedFiles = unassigned.slice(0, filesPerGroup);
            }

            const message = this.formatConventionalCommit(
                g.type,
                g.scope,
                g.subject,
                g.body
            );

            return {
                id: uuidv4(),
                message,
                description: g.body,
                files: matchedFiles,
                confidence: g.confidence
            };
        }).filter(g => g.files.length > 0);

        // Ensure all files are assigned
        const assignedPaths = new Set(commitGroups.flatMap(g => g.files.map(f => f.path)));
        const unassigned = allChanges.filter(f => !assignedPaths.has(f.path));

        if (unassigned.length > 0) {
            if (commitGroups.length > 0) {
                // Add to last group
                commitGroups[commitGroups.length - 1].files.push(...unassigned);
            } else {
                // Create single group with all files
                commitGroups.push({
                    id: uuidv4(),
                    message: 'chore: update changes',
                    description: 'Auto-grouped changes',
                    files: unassigned,
                    confidence: 50
                });
            }
        }

        // Extract reasoning from raw response
        let reasoning = '';
        const reasoningMatch = rawResponse.match(/"reasoning"\s*:\s*"([^"]+)"/i);
        if (reasoningMatch) {
            reasoning = reasoningMatch[1];
        }

        Logger.info(`Built ${commitGroups.length} commit groups`);

        return {
            groups: commitGroups,
            reasoning
        };
    }

    static parseMessageResponse(response: string): string {
        return response
            .replace(/```[\s\S]*?```/g, '')
            .replace(/^[\s\n]+|[\s\n]+$/g, '')
            .trim();
    }

    private static formatConventionalCommit(
        type: string,
        scope: string | undefined,
        subject: string,
        body?: string
    ): string {
        let message = type || 'chore';
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
