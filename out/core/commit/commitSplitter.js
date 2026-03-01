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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitSplitter = void 0;
const fileClassifier_1 = require("../parser/fileClassifier");
const path = __importStar(require("path"));
/**
 * Splits a set of file changes into atomic commit clusters.
 *
 * Strategy:
 * 1. Classify files by domain (auth, api, ui, etc.)
 * 2. Sub-group by top-level folder
 * 3. Merge small clusters into larger ones
 */
class CommitSplitter {
    constructor(splitThreshold = 3) {
        this.splitThreshold = splitThreshold;
    }
    /**
     * Split files into clusters that should each become a separate commit.
     */
    split(files) {
        if (files.length === 0)
            return [];
        // If few files, no need to split
        if (files.length <= this.splitThreshold) {
            return [this.createSingleCluster(files)];
        }
        // Step 1: Classify files by domain
        const domainGroups = fileClassifier_1.FileClassifier.groupByDomain(files);
        // Step 2: Convert to clusters
        const clusters = [];
        for (const [domain, classifiedFiles] of domainGroups) {
            const domainFiles = classifiedFiles.map(cf => cf.file);
            const suggestedType = classifiedFiles[0]?.category || 'chore';
            // Sub-split large domain groups by top-level folder
            if (domainFiles.length > this.splitThreshold * 2) {
                const subClusters = this.splitByFolder(domainFiles, domain, suggestedType);
                clusters.push(...subClusters);
            }
            else {
                const scope = this.inferScope(domainFiles);
                clusters.push({
                    domain,
                    files: domainFiles,
                    suggestedType,
                    suggestedScope: scope,
                });
            }
        }
        // Step 3: Merge very small clusters (1 file) into neighbors
        return this.mergeSmallClusters(clusters);
    }
    createSingleCluster(files) {
        const classified = fileClassifier_1.FileClassifier.classifyAll(files);
        const primaryDomain = this.getMostCommonDomain(classified.map(c => c.domain));
        const suggestedType = classified[0]?.category || 'chore';
        const scope = this.inferScope(files);
        return {
            domain: primaryDomain,
            files,
            suggestedType,
            suggestedScope: scope,
        };
    }
    splitByFolder(files, domain, suggestedType) {
        const folderMap = new Map();
        for (const file of files) {
            const topFolder = file.path.split(path.sep)[0] || 'root';
            const existing = folderMap.get(topFolder) || [];
            existing.push(file);
            folderMap.set(topFolder, existing);
        }
        const clusters = [];
        for (const [folder, folderFiles] of folderMap) {
            clusters.push({
                domain: `${domain}/${folder}`,
                files: folderFiles,
                suggestedType,
                suggestedScope: folder,
            });
        }
        return clusters;
    }
    mergeSmallClusters(clusters) {
        if (clusters.length <= 1)
            return clusters;
        const result = [];
        const smallClusters = [];
        for (const cluster of clusters) {
            if (cluster.files.length === 1) {
                smallClusters.push(cluster);
            }
            else {
                result.push(cluster);
            }
        }
        if (smallClusters.length === 0)
            return result;
        // Merge all single-file clusters into one
        if (smallClusters.length <= this.splitThreshold) {
            const merged = {
                domain: 'misc',
                files: smallClusters.flatMap(c => c.files),
                suggestedType: 'chore',
                suggestedScope: undefined,
            };
            result.push(merged);
        }
        else {
            // Keep them separate but grouped by suggestedType
            const typeGroups = new Map();
            for (const c of smallClusters) {
                const existing = typeGroups.get(c.suggestedType) || [];
                existing.push(...c.files);
                typeGroups.set(c.suggestedType, existing);
            }
            for (const [type, files] of typeGroups) {
                result.push({
                    domain: type,
                    files,
                    suggestedType: type,
                    suggestedScope: undefined,
                });
            }
        }
        return result;
    }
    inferScope(files) {
        if (files.length === 0)
            return undefined;
        if (files.length === 1) {
            const parts = files[0].path.split(path.sep);
            return parts.length > 1 ? parts[0] : undefined;
        }
        // Find common path prefix
        const parts = files.map(f => f.path.split(path.sep));
        const commonParts = [];
        for (let i = 0; i < (parts[0]?.length ?? 0); i++) {
            const part = parts[0][i];
            if (parts.every(p => p[i] === part)) {
                commonParts.push(part);
            }
            else {
                break;
            }
        }
        return commonParts.length > 0 ? commonParts[commonParts.length - 1] : undefined;
    }
    getMostCommonDomain(domains) {
        const counts = new Map();
        for (const d of domains) {
            counts.set(d, (counts.get(d) || 0) + 1);
        }
        let maxDomain = 'unknown';
        let maxCount = 0;
        for (const [domain, count] of counts) {
            if (count > maxCount) {
                maxCount = count;
                maxDomain = domain;
            }
        }
        return maxDomain;
    }
}
exports.CommitSplitter = CommitSplitter;
//# sourceMappingURL=commitSplitter.js.map