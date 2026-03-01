"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCommitStore = void 0;
const zustand_1 = require("zustand");
const generateId = () => Math.random().toString(36).substring(2, 10);
exports.useCommitStore = (0, zustand_1.create)((set, get) => ({
    // Initial state
    stagedFiles: [],
    drafts: [],
    reasoning: null,
    selectedDraftId: null,
    selectedFilePath: null,
    isLoading: false,
    isCommitting: false,
    error: null,
    commitProgress: null,
    providerConfig: {
        provider: 'openai',
        apiKey: '',
        model: '',
    },
    activeView: 'tree',
    // Setters
    setStagedFiles: (files) => set({ stagedFiles: files }),
    setDrafts: (drafts, reasoning = null) => set({ drafts, reasoning, error: null }),
    selectDraft: (id) => set({ selectedDraftId: id }),
    selectFile: (path) => set({ selectedFilePath: path, activeView: 'diff' }),
    setLoading: (loading) => set({ isLoading: loading }),
    setCommitting: (committing) => set({ isCommitting: committing }),
    setError: (error) => set({ error }),
    setCommitProgress: (progress) => set({ commitProgress: progress }),
    setProviderConfig: (config) => set((state) => ({
        providerConfig: { ...state.providerConfig, ...config },
    })),
    setActiveView: (view) => set({ activeView: view }),
    // Draft manipulation
    updateDraftMessage: (id, message) => set((state) => ({
        drafts: state.drafts.map((d) => d.id === id ? { ...d, message, state: 'edited' } : d),
    })),
    removeDraft: (id) => set((state) => ({
        drafts: state.drafts.filter((d) => d.id !== id),
        selectedDraftId: state.selectedDraftId === id ? null : state.selectedDraftId,
    })),
    mergeDrafts: (ids) => set((state) => {
        if (ids.length < 2)
            return state;
        const toMerge = state.drafts.filter((d) => ids.includes(d.id));
        if (toMerge.length < 2)
            return state;
        const merged = {
            id: generateId(),
            message: toMerge.map((d) => d.message).join('\n\n'),
            files: toMerge.flatMap((d) => d.files),
            state: 'edited',
            confidence: Math.min(...toMerge.map((d) => d.confidence)),
        };
        const remaining = state.drafts.filter((d) => !ids.includes(d.id));
        // Insert merged at the position of the first removed
        const firstIdx = state.drafts.findIndex((d) => ids.includes(d.id));
        remaining.splice(firstIdx, 0, merged);
        return { drafts: remaining, selectedDraftId: merged.id };
    }),
    splitDraft: (id, filePaths) => set((state) => {
        const draft = state.drafts.find((d) => d.id === id);
        if (!draft || filePaths.length < 2)
            return state;
        const newDrafts = filePaths.map((paths, i) => ({
            id: generateId(),
            message: `${draft.message} (part ${i + 1})`,
            files: draft.files.filter((f) => paths.includes(f.path)),
            state: 'edited',
            confidence: draft.confidence,
        }));
        const idx = state.drafts.findIndex((d) => d.id === id);
        const result = [...state.drafts];
        result.splice(idx, 1, ...newDrafts);
        return { drafts: result };
    }),
    reorderDrafts: (fromIndex, toIndex) => set((state) => {
        const newDrafts = [...state.drafts];
        const [moved] = newDrafts.splice(fromIndex, 1);
        newDrafts.splice(toIndex, 0, moved);
        return { drafts: newDrafts };
    }),
    confirmDraft: (id) => set((state) => ({
        drafts: state.drafts.map((d) => d.id === id ? { ...d, state: 'confirmed' } : d),
    })),
    markCommitted: (id) => set((state) => ({
        drafts: state.drafts.map((d) => d.id === id ? { ...d, state: 'committed' } : d),
    })),
    reset: () => set({
        stagedFiles: [],
        drafts: [],
        reasoning: null,
        selectedDraftId: null,
        selectedFilePath: null,
        isLoading: false,
        isCommitting: false,
        error: null,
        commitProgress: null,
        activeView: 'tree',
    }),
}));
//# sourceMappingURL=commitStore.js.map