import { FileChange } from '../../types/git';
import * as path from 'path';

interface ClassifiedFile {
    file: FileChange;
    domain: string;
    category: string;
}

/**
 * Classifies files by domain based on path, extension, and content patterns.
 */
export class FileClassifier {
    private static readonly DOMAIN_PATTERNS: Record<string, RegExp[]> = {
        auth: [/auth/i, /login/i, /signup/i, /register/i, /token/i, /session/i, /jwt/i, /oauth/i],
        api: [/api/i, /endpoint/i, /route/i, /controller/i, /handler/i, /middleware/i],
        ui: [/component/i, /page/i, /view/i, /layout/i, /widget/i, /screen/i],
        style: [/\.css$/, /\.scss$/, /\.less$/, /\.styled/, /theme/i, /style/i],
        config: [/config/i, /\.env/, /setting/i, /\.json$/, /\.yaml$/, /\.yml$/, /\.toml$/],
        test: [/test/i, /spec/i, /\.test\./, /\.spec\./, /__tests__/],
        docs: [/docs?/i, /readme/i, /changelog/i, /\.md$/, /license/i],
        build: [/webpack/i, /vite/i, /rollup/i, /babel/i, /tsconfig/i, /eslint/i, /prettier/i],
        data: [/model/i, /schema/i, /migration/i, /seed/i, /database/i, /db/i],
        util: [/util/i, /helper/i, /lib/i, /common/i, /shared/i],
        git: [/\.git/, /gitignore/i, /gitattributes/i],
    };

    private static readonly TYPE_MAP: Record<string, string> = {
        auth: 'feat',
        api: 'feat',
        ui: 'feat',
        style: 'style',
        config: 'chore',
        test: 'test',
        docs: 'docs',
        build: 'build',
        data: 'feat',
        util: 'refactor',
        git: 'chore',
        unknown: 'chore',
    };

    /**
     * Classify a single file into a domain.
     */
    static classify(file: FileChange): ClassifiedFile {
        const filePath = file.path.toLowerCase();
        const ext = path.extname(filePath);
        const dir = path.dirname(filePath);

        // Check path against domain patterns
        for (const [domain, patterns] of Object.entries(this.DOMAIN_PATTERNS)) {
            for (const pattern of patterns) {
                if (pattern.test(filePath) || pattern.test(dir)) {
                    return { file, domain, category: this.TYPE_MAP[domain] };
                }
            }
        }

        // Fallback classification by extension
        const extDomain = this.classifyByExtension(ext);
        return { file, domain: extDomain, category: this.TYPE_MAP[extDomain] || 'chore' };
    }

    /**
     * Classify a batch of files.
     */
    static classifyAll(files: FileChange[]): ClassifiedFile[] {
        return files.map(f => this.classify(f));
    }

    /**
     * Group classified files by domain.
     */
    static groupByDomain(files: FileChange[]): Map<string, ClassifiedFile[]> {
        const classified = this.classifyAll(files);
        const groups = new Map<string, ClassifiedFile[]>();

        for (const cf of classified) {
            const existing = groups.get(cf.domain) || [];
            existing.push(cf);
            groups.set(cf.domain, existing);
        }

        return groups;
    }

    private static classifyByExtension(ext: string): string {
        switch (ext) {
            case '.ts':
            case '.tsx':
            case '.js':
            case '.jsx':
                return 'unknown'; // will fallback to folder-based
            case '.css':
            case '.scss':
            case '.less':
                return 'style';
            case '.json':
            case '.yaml':
            case '.yml':
            case '.toml':
                return 'config';
            case '.md':
            case '.txt':
            case '.rst':
                return 'docs';
            default:
                return 'unknown';
        }
    }
}
