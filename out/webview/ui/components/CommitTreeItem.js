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
exports.default = CommitTreeItem;
const react_1 = __importStar(require("react"));
const commitStore_1 = require("../store/commitStore");
const useVSCodeAPI_1 = require("../hooks/useVSCodeAPI");
function CommitTreeItem({ draft, isSelected, index, onSelect }) {
    const [expanded, setExpanded] = (0, react_1.useState)(false);
    const [editing, setEditing] = (0, react_1.useState)(false);
    const [editMessage, setEditMessage] = (0, react_1.useState)(draft.message);
    const { updateDraftMessage, removeDraft, confirmDraft, selectFile } = (0, commitStore_1.useCommitStore)();
    const { postMessage } = (0, useVSCodeAPI_1.useVSCodeAPI)();
    const handleSave = () => {
        updateDraftMessage(draft.id, editMessage);
        setEditing(false);
    };
    const handleCommitSingle = () => {
        confirmDraft(draft.id);
        postMessage('commitSingle', { draft });
    };
    const stateIcon = {
        draft: '○',
        generated: '◉',
        edited: '✎',
        confirmed: '✓',
        committed: '✔',
    }[draft.state];
    const stateClass = `state-${draft.state}`;
    const subjectLine = draft.message.split('\n')[0];
    const addCount = draft.files.reduce((acc, f) => acc + f.additions, 0);
    const delCount = draft.files.reduce((acc, f) => acc + f.deletions, 0);
    return (react_1.default.createElement("div", { className: `commit-tree-item ${isSelected ? 'selected' : ''} ${stateClass}` },
        react_1.default.createElement("div", { className: "commit-item-header", onClick: onSelect },
            react_1.default.createElement("button", { className: "expand-btn", onClick: (e) => { e.stopPropagation(); setExpanded(!expanded); } }, expanded ? '▾' : '▸'),
            react_1.default.createElement("span", { className: "state-icon" }, stateIcon),
            react_1.default.createElement("span", { className: "commit-message-preview", title: draft.message }, subjectLine),
            react_1.default.createElement("span", { className: "confidence-badge", title: `Confidence: ${draft.confidence}%` },
                draft.confidence,
                "%")),
        expanded && (react_1.default.createElement("div", { className: "commit-item-details" },
            react_1.default.createElement("div", { className: "commit-stats" },
                react_1.default.createElement("span", { className: "stat-add" },
                    "+",
                    addCount),
                react_1.default.createElement("span", { className: "stat-del" },
                    "\u2212",
                    delCount),
                react_1.default.createElement("span", { className: "stat-files" },
                    draft.files.length,
                    " file",
                    draft.files.length !== 1 ? 's' : '')),
            react_1.default.createElement("div", { className: "commit-files" }, draft.files.map(f => (react_1.default.createElement("div", { key: f.path, className: "file-entry", onClick: () => selectFile(f.path), title: f.path },
                react_1.default.createElement("span", { className: `change-badge ${f.changeType}` }, f.changeType[0].toUpperCase()),
                react_1.default.createElement("span", { className: "file-name" }, f.path.split('/').pop()),
                react_1.default.createElement("span", { className: "file-path" }, f.path))))),
            editing ? (react_1.default.createElement("div", { className: "commit-edit" },
                react_1.default.createElement("textarea", { className: "commit-edit-textarea", value: editMessage, onChange: (e) => setEditMessage(e.target.value), rows: 4 }),
                react_1.default.createElement("div", { className: "commit-edit-actions" },
                    react_1.default.createElement("button", { className: "btn btn-primary btn-sm", onClick: handleSave }, "Save"),
                    react_1.default.createElement("button", { className: "btn btn-secondary btn-sm", onClick: () => { setEditing(false); setEditMessage(draft.message); } }, "Cancel")))) : (react_1.default.createElement("div", { className: "commit-actions" },
                react_1.default.createElement("button", { className: "btn btn-sm", onClick: () => setEditing(true), title: "Edit" }, "\u270F\uFE0F Edit"),
                react_1.default.createElement("button", { className: "btn btn-sm", onClick: () => removeDraft(draft.id), title: "Delete" }, "\uD83D\uDDD1\uFE0F"),
                react_1.default.createElement("button", { className: "btn btn-primary btn-sm", onClick: handleCommitSingle, title: "Commit" }, "\u2705 Commit")))))));
}
//# sourceMappingURL=CommitTreeItem.js.map