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
const git_1 = require("../types/git");
class GitService {
    constructor() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }
        this.git = (0, simple_git_1.default)(workspaceFolder.uri.fsPath);
    }
    async getStagedChanges() {
        const status = await this.git.status();
        const changes = [];
        for (const file of status.files) {
            // 'index' represents the status of the file in the index (staged)
            if (file.index !== ' ' && file.index !== '?') {
                const diff = await this.getFileDiff(file.path, true);
                changes.push({
                    path: file.path,
                    changeType: this.mapChangeType(file.index),
                    diff: diff,
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
            // 'working_dir' represents the status of the file in the working directory (unstaged)
            if (file.working_dir !== ' ' && file.working_dir !== '?') {
                const diff = await this.getFileDiff(file.path, false);
                changes.push({
                    path: file.path,
                    changeType: this.mapChangeType(file.working_dir),
                    diff: diff,
                    additions: this.countAdditions(diff),
                    deletions: this.countDeletions(diff)
                });
            }
        }
        return changes;
    }
    async getFileDiff(filePath, staged) {
        const args = staged ? ['--cached'] : [];
        const diff = await this.git.diff([...args, '--', filePath]);
        return diff;
    }
    async stageFiles(files) {
        await this.git.add(files);
    }
    async unstageFiles(files) {
        await this.git.reset(['HEAD', '--', ...files]);
    }
    async createCommit(message, files) {
        // Stage only specified files
        // First we need to know what is currently staged to restore it later?
        // Or we assume the user wants to commit ONLY these files as a group.
        // The Idea.md says "intelligently groups staged changes".
        // So they are ALREADY staged.
        // If we want to commit a SUBSET of staged changes, we effectively need to:
        // 1. Unstage everything? No, that loses the intent of what was staged vs unstaged.
        // 2. Commit --only <files>? Does git support commit only specific files from index?
        //    Git commit <files> stages them and commits them. But if they are ALREADY staged, it works.
        //    However, if we have files A, B, C staged, and we want to commit only A and B.
        //    We can run `git commit -m "msg" -- A B`.
        await this.git.commit(message, files);
    }
    mapChangeType(gitStatus) {
        switch (gitStatus) {
            case 'M': return git_1.ChangeType.Modified;
            case 'A': return git_1.ChangeType.Added;
            case 'D': return git_1.ChangeType.Deleted;
            case 'R': return git_1.ChangeType.Renamed;
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