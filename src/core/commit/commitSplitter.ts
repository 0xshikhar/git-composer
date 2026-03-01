import { FileChange, FileCluster } from '../../types/git';
import { FileClassifier } from '../parser/fileClassifier';
import * as path from 'path';

/**
 * Splits a set of file changes into atomic commit clusters.
 * 
 * Strategy:
 * 1. Classify files by domain (auth, api, ui, etc.)
 * 2. Sub-group by top-level folder
 * 3. Merge small clusters into larger ones
 */
export class CommitSplitter {
    private splitThreshold: number;

    constructor(splitThreshold: number = 3) {
        this.splitThreshold = splitThreshold;
    }

    /**
     * Split files into clusters that should each become a separate commit.
     */
    split(files: FileChange[]): FileCluster[] {
        if (files.length === 0) return [];

        // If few files, no need to split
        if (files.length <= this.splitThreshold) {
            return [this.createSingleCluster(files)];
        }

        // Step 1: Classify files by domain
        const domainGroups = FileClassifier.groupByDomain(files);

        // Step 2: Convert to clusters
        const clusters: FileCluster[] = [];
        for (const [domain, classifiedFiles] of domainGroups) {
            const domainFiles = classifiedFiles.map(cf => cf.file);
            const suggestedType = classifiedFiles[0]?.category || 'chore';

            // Sub-split large domain groups by top-level folder
            if (domainFiles.length > this.splitThreshold * 2) {
                const subClusters = this.splitByFolder(domainFiles, domain, suggestedType);
                clusters.push(...subClusters);
            } else {
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

    private createSingleCluster(files: FileChange[]): FileCluster {
        const classified = FileClassifier.classifyAll(files);
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

    private splitByFolder(
        files: FileChange[],
        domain: string,
        suggestedType: string
    ): FileCluster[] {
        const folderMap = new Map<string, FileChange[]>();

        for (const file of files) {
            const topFolder = file.path.split(path.sep)[0] || 'root';
            const existing = folderMap.get(topFolder) || [];
            existing.push(file);
            folderMap.set(topFolder, existing);
        }

        const clusters: FileCluster[] = [];
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

    private mergeSmallClusters(clusters: FileCluster[]): FileCluster[] {
        if (clusters.length <= 1) return clusters;

        const result: FileCluster[] = [];
        const smallClusters: FileCluster[] = [];

        for (const cluster of clusters) {
            if (cluster.files.length === 1) {
                smallClusters.push(cluster);
            } else {
                result.push(cluster);
            }
        }

        if (smallClusters.length === 0) return result;

        // Merge all single-file clusters into one
        if (smallClusters.length <= this.splitThreshold) {
            const merged: FileCluster = {
                domain: 'misc',
                files: smallClusters.flatMap(c => c.files),
                suggestedType: 'chore',
                suggestedScope: undefined,
            };
            result.push(merged);
        } else {
            // Keep them separate but grouped by suggestedType
            const typeGroups = new Map<string, FileChange[]>();
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

    private inferScope(files: FileChange[]): string | undefined {
        if (files.length === 0) return undefined;
        if (files.length === 1) {
            const parts = files[0].path.split(path.sep);
            return parts.length > 1 ? parts[0] : undefined;
        }

        // Find common path prefix
        const parts = files.map(f => f.path.split(path.sep));
        const commonParts: string[] = [];

        for (let i = 0; i < (parts[0]?.length ?? 0); i++) {
            const part = parts[0][i];
            if (parts.every(p => p[i] === part)) {
                commonParts.push(part);
            } else {
                break;
            }
        }

        return commonParts.length > 0 ? commonParts[commonParts.length - 1] : undefined;
    }

    private getMostCommonDomain(domains: string[]): string {
        const counts = new Map<string, number>();
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
