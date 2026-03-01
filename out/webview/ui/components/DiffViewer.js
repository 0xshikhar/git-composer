"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DiffViewer;
const react_1 = __importDefault(require("react"));
const commitStore_1 = require("../store/commitStore");
/**
 * DiffViewer — shows a styled diff output for the selected file.
 * (Monaco editor is not easily embeddable in a VS Code sidebar webview
 *  due to CSP restrictions. We use a lightweight syntax-highlighted diff view instead.)
 */
function DiffViewer() {
    const { selectedFilePath, drafts, stagedFiles, activeView, setActiveView } = (0, commitStore_1.useCommitStore)();
    if (activeView !== 'diff' || !selectedFilePath) {
        return null;
    }
    // Find the diff string from staged files or drafts
    const file = stagedFiles.find(f => f.path === selectedFilePath)
        || drafts.flatMap(d => d.files).find(f => f.path === selectedFilePath);
    if (!file) {
        return (react_1.default.createElement("div", { className: "diff-viewer" },
            react_1.default.createElement("div", { className: "diff-header" },
                react_1.default.createElement("span", null, "No diff available"),
                react_1.default.createElement("button", { className: "btn btn-sm", onClick: () => setActiveView('tree') }, "\u2715"))));
    }
    const renderDiffLines = (diff) => {
        if (!diff || diff.trim() === '') {
            return react_1.default.createElement("div", { className: "diff-empty" }, "Binary file or no text diff available.");
        }
        return diff.split('\n').map((line, i) => {
            let cls = 'diff-line';
            if (line.startsWith('+') && !line.startsWith('+++'))
                cls += ' diff-add';
            else if (line.startsWith('-') && !line.startsWith('---'))
                cls += ' diff-del';
            else if (line.startsWith('@@'))
                cls += ' diff-hunk';
            else if (line.startsWith('diff ') || line.startsWith('index '))
                cls += ' diff-meta';
            return (react_1.default.createElement("div", { key: i, className: cls },
                react_1.default.createElement("span", { className: "diff-line-num" }, i + 1),
                react_1.default.createElement("span", { className: "diff-line-content" }, line || ' ')));
        });
    };
    return (react_1.default.createElement("div", { className: "diff-viewer" },
        react_1.default.createElement("div", { className: "diff-header" },
            react_1.default.createElement("span", { className: "diff-file-name" }, selectedFilePath),
            react_1.default.createElement("div", { className: "diff-header-stats" },
                react_1.default.createElement("span", { className: "stat-add" },
                    "+",
                    file.additions),
                react_1.default.createElement("span", { className: "stat-del" },
                    "\u2212",
                    file.deletions)),
            react_1.default.createElement("button", { className: "btn btn-sm", onClick: () => setActiveView('tree') }, "\u2715 Close")),
        react_1.default.createElement("div", { className: "diff-content" }, renderDiffLines(file.diff))));
}
//# sourceMappingURL=DiffViewer.js.map