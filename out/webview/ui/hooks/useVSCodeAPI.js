"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useVSCodeAPI = useVSCodeAPI;
const react_1 = require("react");
let vscodeApi = null;
function getVSCodeAPI() {
    if (vscodeApi)
        return vscodeApi;
    if (window.acquireVsCodeApi) {
        vscodeApi = window.acquireVsCodeApi();
    }
    else {
        // Mock for development
        vscodeApi = {
            postMessage: (msg) => console.log('[Mock postMessage]', msg),
            getState: () => ({}),
            setState: () => { },
        };
    }
    return vscodeApi;
}
/**
 * Hook to communicate with the VS Code extension host.
 */
function useVSCodeAPI() {
    const api = getVSCodeAPI();
    const postMessage = (0, react_1.useCallback)((command, data) => {
        api.postMessage({ command, ...data });
    }, [api]);
    const onMessage = (0, react_1.useCallback)((handler) => {
        const listener = (event) => {
            handler(event.data);
        };
        window.addEventListener('message', listener);
        return () => window.removeEventListener('message', listener);
    }, []);
    return { postMessage, onMessage, api };
}
//# sourceMappingURL=useVSCodeAPI.js.map