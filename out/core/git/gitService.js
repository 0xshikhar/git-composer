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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitService = void 0;
const simple_git_1 = __importDefault(require("simple-git"));
const vscode = __importStar(require("vscode"));
const git_1 = require("../../types/git");
class GitService {
    constructor() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }
        this.workspacePath = workspaceFolder.uri.fsPath;
        this.git = (0, simple_git_1.default)(this.workspacePath);
    }
    // --- Staged / Unstaged ---
    async getStagedChanges() {
        const status = await this.git.status();
        const changes = [];
        for (const file of status.files) {
            if (file.index !== ' ' && file.index !== '?') {
                const diff = await this.getFileDiff(file.path, true);
                changes.push({
                    path: file.path,
                    changeType: this.mapChangeType(file.index),
                    diff,
                    additions: this.countAdditions(diff),
                    deletions: this.countDeletions(diff)
                });
            }
        }
        return changes;
    }
    async getUnstagedChanges() {
        const status = await this.git.status();
        const changes = [];
        for (const file of status.files) {
            if (file.working_dir !== ' ' && file.working_dir !== '?') {
                const diff = await this.getFileDiff(file.path, false);
                changes.push({
                    path: file.path,
                    changeType: this.mapChangeType(file.working_dir),
                    diff,
                    additions: this.countAdditions(diff),
                    deletions: this.countDeletions(diff)
                });
            }
        }
        return changes;
    }
    // --- File diffs ---
    async getFileDiff(filePath, staged) {
        const args = staged ? ['--cached'] : [];
        return this.git.diff([...args, '--', filePath]);
    }
    async getStagedDiff() {
        return this.git.diff(['--cached', '--patch', '--no-color']);
    }
    // --- Stage / Unstage ---
    async stageFiles(files) {
        await this.git.add(files);
    }
    async unstageFiles(files) {
        await this.git.reset(['HEAD', '--', ...files]);
    }
    async unstageAll() {
        await this.git.reset(['HEAD']);
    }
    // --- Commit ---
    async createCommit(message, files) {
        await this.git.commit(message, files);
    }
    // --- Repository context ---
    async getRepoContext() {
        const [branchResult, logResult] = await Promise.all([
            this.git.branch(),
            this.git.log({ maxCount: 10 }),
        ]);
        const repoName = this.workspacePath.split('/').pop() || 'unknown';
        const branch = branchResult.current;
        const recentCommits = logResult.all.map(c => c.message);
        // Detect project type from common config files
        const projectType = await this.detectProjectType();
        return { repoName, branch, recentCommits, projectType };
    }
    async getRecentCommits(count = 10) {
        const log = await this.git.log({ maxCount: count });
        return log.all.map(c => c.message);
    }
    // --- Helpers ---
    async detectProjectType() {
        try {
            const status = await this.git.raw(['ls-files']);
            const files = status.split('\n');
            if (files.some(f => f === 'package.json'))
                return 'node';
            if (files.some(f => f === 'Cargo.toml'))
                return 'rust';
            if (files.some(f => f === 'go.mod'))
                return 'go';
            if (files.some(f => f === 'requirements.txt' || f === 'pyproject.toml'))
                return 'python';
            if (files.some(f => f === 'pom.xml' || f === 'build.gradle'))
                return 'java';
            return 'unknown';
        }
        catch {
            return 'unknown';
        }
    }
    mapChangeType(gitStatus) {
        switch (gitStatus) {
            case 'M': return git_1.ChangeType.Modified;
            case 'A': return git_1.ChangeType.Added;
            case 'D': return git_1.ChangeType.Deleted;
            case 'R': return git_1.ChangeType.Renamed;
            case 'C': return git_1.ChangeType.Copied;
            default: return git_1.ChangeType.Modified;
        }
    }
    countAdditions(diff) {
        return (diff.match(/^\+(?!\+\+)/gm) || []).length;
    }
    countDeletions(diff) {
        return (diff.match(/^-(?!--)/gm) || []).length;
    }
}
exports.GitService = GitService;
//# sourceMappingURL=gitService.js.map