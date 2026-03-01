import { useEffect, useCallback } from 'react';

interface VSCodeAPI {
    postMessage: (msg: any) => void;
    getState: () => any;
    setState: (state: any) => void;
}

let vscodeApi: VSCodeAPI | null = null;

function getVSCodeAPI(): VSCodeAPI {
    if (vscodeApi) return vscodeApi;

    if ((window as any).acquireVsCodeApi) {
        vscodeApi = (window as any).acquireVsCodeApi();
    } else {
        // Mock for development
        vscodeApi = {
            postMessage: (msg: any) => console.log('[Mock postMessage]', msg),
            getState: () => ({}),
            setState: () => { },
        };
    }

    return vscodeApi!;
}

/**
 * Hook to communicate with the VS Code extension host.
 */
export function useVSCodeAPI() {
    const api = getVSCodeAPI();

    const postMessage = useCallback((command: string, data?: any) => {
        api.postMessage({ command, ...data });
    }, [api]);

    const onMessage = useCallback((handler: (message: any) => void) => {
        const listener = (event: MessageEvent) => {
            handler(event.data);
        };
        window.addEventListener('message', listener);
        return () => window.removeEventListener('message', listener);
    }, []);

    return { postMessage, onMessage, api };
}
