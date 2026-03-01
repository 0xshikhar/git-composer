"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CommitTree;
const react_1 = __importDefault(require("react"));
const commitStore_1 = require("../store/commitStore");
const CommitTreeItem_1 = __importDefault(require("./CommitTreeItem"));
function CommitTree() {
    const { drafts, selectedDraftId, selectDraft, reorderDrafts } = (0, commitStore_1.useCommitStore)();
    if (drafts.length === 0) {
        return (react_1.default.createElement("div", { className: "commit-tree-empty" },
            react_1.default.createElement("p", { className: "empty-text" }, "No draft commits yet."),
            react_1.default.createElement("p", { className: "empty-hint" },
                "Stage changes and click ",
                react_1.default.createElement("strong", null, "Auto-Compose"),
                " to generate intelligent commit proposals.")));
    }
    const handleDragStart = (e, index) => {
        e.dataTransfer.setData('text/plain', index.toString());
    };
    const handleDrop = (e, toIndex) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        if (fromIndex !== toIndex) {
            reorderDrafts(fromIndex, toIndex);
        }
    };
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    return (react_1.default.createElement("div", { className: "commit-tree" },
        react_1.default.createElement("div", { className: "commit-tree-header" },
            react_1.default.createElement("span", { className: "section-label" },
                "Draft Commits (",
                drafts.length,
                ")")),
        react_1.default.createElement("div", { className: "commit-tree-list" }, drafts.map((draft, index) => (react_1.default.createElement("div", { key: draft.id, draggable: true, onDragStart: (e) => handleDragStart(e, index), onDrop: (e) => handleDrop(e, index), onDragOver: handleDragOver },
            react_1.default.createElement(CommitTreeItem_1.default, { draft: draft, isSelected: selectedDraftId === draft.id, index: index, onSelect: () => selectDraft(draft.id) })))))));
}
//# sourceMappingURL=CommitTree.js.map