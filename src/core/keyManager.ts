import * as vscode from 'vscode';

export interface StoredApiKey {
    key: string;
    label?: string;
    lastUsed?: number;
}

export interface ProviderKeys {
    keys: StoredApiKey[];
    currentIndex: number;
}

export class KeyManager {
    private static readonly STORAGE_KEY = 'git-composer-api-keys';
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    private getStorage(): Record<string, ProviderKeys> {
        return this.context.globalState.get<Record<string, ProviderKeys>>(KeyManager.STORAGE_KEY) || {};
    }

    private saveStorage(storage: Record<string, ProviderKeys>): void {
        this.context.globalState.update(KeyManager.STORAGE_KEY, storage);
    }

    getKeys(provider: string): StoredApiKey[] {
        const storage = this.getStorage();
        return storage[provider]?.keys || [];
    }

    getAllProviders(): string[] {
        const storage = this.getStorage();
        return Object.keys(storage);
    }

    hasKey(provider: string): boolean {
        const keys = this.getKeys(provider);
        return keys.length > 0;
    }

    addKey(provider: string, key: string, label?: string): void {
        const storage = this.getStorage();
        
        if (!storage[provider]) {
            storage[provider] = { keys: [], currentIndex: 0 };
        }

        // Check if key already exists
        const exists = storage[provider].keys.some(k => k.key === key);
        if (!exists) {
            storage[provider].keys.push({ key, label, lastUsed: Date.now() });
            this.saveStorage(storage);
        }
    }

    removeKey(provider: string, keyIndex: number): void {
        const storage = this.getStorage();
        if (storage[provider] && storage[provider].keys[keyIndex]) {
            storage[provider].keys.splice(keyIndex, 1);
            // Reset index if out of bounds
            if (storage[provider].currentIndex >= storage[provider].keys.length) {
                storage[provider].currentIndex = 0;
            }
            this.saveStorage(storage);
        }
    }

    getNextKey(provider: string): string | null {
        const storage = this.getStorage();
        const providerKeys = storage[provider];
        
        if (!providerKeys || providerKeys.keys.length === 0) {
            return null;
        }

        // Rotate to next key
        const key = providerKeys.keys[providerKeys.currentIndex];
        providerKeys.currentIndex = (providerKeys.currentIndex + 1) % providerKeys.keys.length;
        
        // Update last used
        key.lastUsed = Date.now();
        this.saveStorage(storage);

        return key.key;
    }

    getCurrentKey(provider: string): string | null {
        const storage = this.getStorage();
        const providerKeys = storage[provider];
        
        if (!providerKeys || providerKeys.keys.length === 0) {
            return null;
        }

        return providerKeys.keys[providerKeys.currentIndex]?.key || null;
    }

    resetProvider(provider: string): void {
        const storage = this.getStorage();
        delete storage[provider];
        this.saveStorage(storage);
    }

    resetAll(): void {
        this.saveStorage({});
    }

    getKeyCount(provider: string): number {
        return this.getKeys(provider).length;
    }

    // Get all keys as masked for display
    getKeysForDisplay(provider: string): { label: string; masked: string; lastUsed?: number }[] {
        const keys = this.getKeys(provider);
        return keys.map((k, i) => ({
            label: k.label || `Key ${i + 1}`,
            masked: this.maskKey(k.key),
            lastUsed: k.lastUsed
        }));
    }

    private maskKey(key: string): string {
        if (key.length <= 8) {
            return '*'.repeat(key.length);
        }
        return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
    }
}
