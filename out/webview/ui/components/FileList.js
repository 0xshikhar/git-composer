"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FileList;
const react_1 = __importDefault(require("react"));
const commitStore_1 = require("../store/commitStore");
function FileList() {
    const { stagedFiles, selectFile } = (0, commitStore_1.useCommitStore)();
    if (stagedFiles.length === 0) {
        return (react_1.default.createElement("div", { className: "file-list-empty" },
            react_1.default.createElement("p", { className: "empty-text" }, "No staged changes."),
            react_1.default.createElement("p", { className: "empty-hint" },
                "Stage files with ",
                react_1.default.createElement("code", null, "git add"),
                " to begin composing.")));
    }
    const totalAdd = stagedFiles.reduce((acc, f) => acc + f.additions, 0);
    const totalDel = stagedFiles.reduce((acc, f) => acc + f.deletions, 0);
    return (react_1.default.createElement("div", { className: "file-list" },
        react_1.default.createElement("div", { className: "file-list-header" },
            react_1.default.createElement("span", { className: "section-label" },
                "Staged Changes (",
                stagedFiles.length,
                ")"),
            react_1.default.createElement("div", { className: "file-list-stats" },
                react_1.default.createElement("span", { className: "stat-add" },
                    "+",
                    totalAdd),
                react_1.default.createElement("span", { className: "stat-del" },
                    "\u2212",
                    totalDel))),
        react_1.default.createElement("div", { className: "file-list-items" }, stagedFiles.map(file => (react_1.default.createElement("div", { key: file.path, className: "file-list-item", onClick: () => selectFile(file.path), title: file.path },
            react_1.default.createElement("span", { className: `change-badge ${file.changeType}` }, file.changeType[0].toUpperCase()),
            react_1.default.createElement("span", { className: "file-name" }, file.path.split('/').pop()),
            react_1.default.createElement("span", { className: "file-stats" },
                react_1.default.createElement("span", { className: "stat-add" },
                    "+",
                    file.additions),
                react_1.default.createElement("span", { className: "stat-del" },
                    "\u2212",
                    file.deletions))))))));
}
//# sourceMappingURL=FileList.js.map