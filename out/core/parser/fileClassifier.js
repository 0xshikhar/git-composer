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
exports.FileClassifier = void 0;
const path = __importStar(require("path"));
/**
 * Classifies files by domain based on path, extension, and content patterns.
 */
class FileClassifier {
    /**
     * Classify a single file into a domain.
     */
    static classify(file) {
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
    static classifyAll(files) {
        return files.map(f => this.classify(f));
    }
    /**
     * Group classified files by domain.
     */
    static groupByDomain(files) {
        const classified = this.classifyAll(files);
        const groups = new Map();
        for (const cf of classified) {
            const existing = groups.get(cf.domain) || [];
            existing.push(cf);
            groups.set(cf.domain, existing);
        }
        return groups;
    }
    static classifyByExtension(ext) {
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
exports.FileClassifier = FileClassifier;
FileClassifier.DOMAIN_PATTERNS = {
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
FileClassifier.TYPE_MAP = {
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
//# sourceMappingURL=fileClassifier.js.map