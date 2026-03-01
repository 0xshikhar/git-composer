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
exports.default = CommitEditor;
const react_1 = __importStar(require("react"));
const commitStore_1 = require("../store/commitStore");
function CommitEditor() {
    const { selectedDraftId, drafts, updateDraftMessage, setActiveView } = (0, commitStore_1.useCommitStore)();
    if (!selectedDraftId) {
        return null;
    }
    const draft = drafts.find(d => d.id === selectedDraftId);
    if (!draft)
        return null;
    const [message, setMessage] = (0, react_1.useState)(draft.message);
    const subjectLength = message.split('\n')[0].length;
    const isOverLimit = subjectLength > 72;
    const handleSave = () => {
        updateDraftMessage(draft.id, message);
    };
    return (react_1.default.createElement("div", { className: "commit-editor" },
        react_1.default.createElement("div", { className: "commit-editor-header" },
            react_1.default.createElement("span", { className: "section-label" }, "Edit Commit Message"),
            react_1.default.createElement("button", { className: "btn btn-sm", onClick: () => setActiveView('tree') }, "\u2715")),
        react_1.default.createElement("div", { className: "commit-editor-body" },
            react_1.default.createElement("textarea", { className: "commit-editor-textarea", value: message, onChange: (e) => setMessage(e.target.value), rows: 6, placeholder: "type(scope): subject\n\nbody", spellCheck: false }),
            react_1.default.createElement("div", { className: "commit-editor-hints" },
                react_1.default.createElement("span", { className: `char-count ${isOverLimit ? 'over-limit' : ''}` },
                    "Subject: ",
                    subjectLength,
                    "/72"),
                react_1.default.createElement("span", { className: "format-hint" }, "Format: type(scope): subject")),
            react_1.default.createElement("div", { className: "commit-editor-actions" },
                react_1.default.createElement("button", { className: "btn btn-primary", onClick: handleSave }, "\uD83D\uDCBE Save Message"),
                react_1.default.createElement("button", { className: "btn btn-secondary", onClick: () => setMessage(draft.message) }, "\u21A9 Reset")))));
}
//# sourceMappingURL=CommitEditor.js.map