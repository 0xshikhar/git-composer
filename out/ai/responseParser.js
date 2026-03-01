"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseParser = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
class ResponseParser {
    static parseGroupingResponse(response, allChanges) {
        try {
            logger_1.Logger.debug('Raw AI response received', { responseLength: response.length });
            logger_1.Logger.debug('Raw AI response content', { response });
            // Try to extract JSON from markdown code blocks
            let jsonStr = response;
            // Check for ```json code blocks
            const jsonBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonBlockMatch) {
                jsonStr = jsonBlockMatch[1];
                logger_1.Logger.debug('Extracted JSON from ```json block');
            }
            else {
                // Check for generic ``` code blocks
                const codeBlockMatch = response.match(/```\s*([\s\S]*?)\s*```/);
                if (codeBlockMatch) {
                    jsonStr = codeBlockMatch[1];
                    logger_1.Logger.debug('Extracted JSON from ``` block');
                }
            }
            // Clean up the JSON string
            jsonStr = jsonStr.trim();
            logger_1.Logger.debug('JSON string to parse', { jsonStr });
            const parsed = JSON.parse(jsonStr);
            logger_1.Logger.debug('Successfully parsed JSON', { parsed });
            if (!parsed.groups || !Array.isArray(parsed.groups)) {
                throw new Error('Response does not contain a valid "groups" array');
            }
            const groups = parsed.groups.map((group, index) => {
                logger_1.Logger.debug(`Processing group ${index}`, { group });
                if (!group.files || !Array.isArray(group.files)) {
                    logger_1.Logger.warn(`Group ${index} missing files array`, { group });
                    group.files = [];
                }
                const files = allChanges.filter(change => group.files.includes(change.path));
                logger_1.Logger.debug(`Matched ${files.length} files for group ${index}`, {
                    requestedFiles: group.files,
                    matchedFiles: files.map(f => f.path)
                });
                const message = this.formatConventionalCommit(group.type || 'chore', group.scope, group.subject || 'Update files', group.body);
                return {
                    id: (0, uuid_1.v4)(),
                    message: message,
                    description: group.body,
                    files: files,
                    confidence: group.confidence || 80
                };
            });
            logger_1.Logger.info(`Successfully parsed ${groups.length} commit groups`);
            return {
                groups,
                reasoning: parsed.reasoning
            };
        }
        catch (error) {
            logger_1.Logger.error('Failed to parse AI response', error);
            logger_1.Logger.error('Response content that failed to parse', { response });
            throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    static parseMessageResponse(response) {
        logger_1.Logger.debug('Parsing message response', { response });
        // Remove markdown code blocks if present
        const cleaned = response
            .replace(/```[\s\S]*?```/g, '')
            .trim();
        logger_1.Logger.debug('Cleaned message response', { cleaned });
        return cleaned;
    }
    static formatConventionalCommit(type, scope, subject, body) {
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
exports.ResponseParser = ResponseParser;
//# sourceMappingURL=responseParser.js.map