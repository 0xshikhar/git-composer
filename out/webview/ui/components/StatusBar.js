"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StatusBar;
const react_1 = __importDefault(require("react"));
const commitStore_1 = require("../store/commitStore");
function StatusBar() {
    const { isLoading, isCommitting, error, commitProgress, drafts, reasoning } = (0, commitStore_1.useCommitStore)();
    if (isCommitting && commitProgress) {
        return (react_1.default.createElement("div", { className: "status-bar status-committing" },
            react_1.default.createElement("span", { className: "status-icon" }, "\u23F3"),
            react_1.default.createElement("span", null,
                "Committing ",
                commitProgress.current,
                "/",
                commitProgress.total,
                "\u2026"),
            react_1.default.createElement("div", { className: "progress-bar" },
                react_1.default.createElement("div", { className: "progress-bar-fill", style: { width: `${(commitProgress.current / commitProgress.total) * 100}%` } }))));
    }
    if (isLoading) {
        return (react_1.default.createElement("div", { className: "status-bar status-loading" },
            react_1.default.createElement("span", { className: "status-icon spinning" }, "\u25CC"),
            react_1.default.createElement("span", null, "Analyzing changes with AI\u2026")));
    }
    if (error) {
        return (react_1.default.createElement("div", { className: "status-bar status-error" },
            react_1.default.createElement("span", { className: "status-icon" }, "\u26A0\uFE0F"),
            react_1.default.createElement("span", { className: "error-text" }, error)));
    }
    if (drafts.length > 0) {
        const total = drafts.length;
        const committed = drafts.filter(d => d.state === 'committed').length;
        const avgConfidence = Math.round(drafts.reduce((acc, d) => acc + d.confidence, 0) / total);
        return (react_1.default.createElement("div", { className: "status-bar status-ready" },
            react_1.default.createElement("span", { className: "status-icon" }, "\u2705"),
            react_1.default.createElement("span", null,
                total,
                " draft",
                total !== 1 ? 's' : ''),
            committed > 0 && react_1.default.createElement("span", { className: "status-committed" },
                "(",
                committed,
                " committed)"),
            react_1.default.createElement("span", { className: "status-confidence" },
                "Avg confidence: ",
                avgConfidence,
                "%"),
            reasoning && (react_1.default.createElement("span", { className: "status-reasoning", title: reasoning }, "\uD83D\uDCA1"))));
    }
    return null;
}
//# sourceMappingURL=StatusBar.js.map