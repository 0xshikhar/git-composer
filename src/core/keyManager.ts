import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

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

    private async getStorage(): Promise<Record<string, ProviderKeys>> {
        try {
            const raw = await this.context.secrets.get(KeyManager.STORAGE_KEY);
            if (!raw) return {};
            return JSON.parse(raw);
        } catch (e) {
            Logger.error('Failed to read secure storage', e);
            return {};
        }
    }

    private async saveStorage(storage: Record<string, ProviderKeys>): Promise<void> {
        try {
            await this.context.secrets.store(KeyManager.STORAGE_KEY, JSON.stringify(storage));
        } catch (e) {
            Logger.error('Failed to write to secure storage', e);
        }
    }

    async getKeys(provider: string): Promise<StoredApiKey[]> {
        const storage = await this.getStorage();
        return storage[provider]?.keys || [];
    }

    async getAllProviders(): Promise<string[]> {
        const storage = await this.getStorage();
        return Object.keys(storage);
    }

    async hasKey(provider: string): Promise<boolean> {
        const keys = await this.getKeys(provider);
        return keys.length > 0;
    }

    async addKey(provider: string, key: string, label?: string): Promise<void> {
        const storage = await this.getStorage();

        if (!storage[provider]) {
            storage[provider] = { keys: [], currentIndex: 0 };
        }

        // Check if key already exists
        const exists = storage[provider].keys.some(k => k.key === key);
        if (!exists) {
            storage[provider].keys.push({ key, label, lastUsed: Date.now() });
            await this.saveStorage(storage);
        }
    }

    async removeKey(provider: string, keyIndex: number): Promise<void> {
        const storage = await this.getStorage();
        if (storage[provider] && storage[provider].keys[keyIndex]) {
            storage[provider].keys.splice(keyIndex, 1);
            // Reset index if out of bounds
            if (storage[provider].currentIndex >= storage[provider].keys.length) {
                storage[provider].currentIndex = 0;
            }
            await this.saveStorage(storage);
        }
    }

    async getNextKey(provider: string): Promise<string | null> {
        const storage = await this.getStorage();
        const providerKeys = storage[provider];

        if (!providerKeys || providerKeys.keys.length === 0) {
            return null;
        }

        // Rotate to next key
        const key = providerKeys.keys[providerKeys.currentIndex];
        providerKeys.currentIndex = (providerKeys.currentIndex + 1) % providerKeys.keys.length;

        // Update last used
        key.lastUsed = Date.now();
        await this.saveStorage(storage);

        return key.key;
    }

    async getCurrentKey(provider: string): Promise<string | null> {
        const storage = await this.getStorage();
        const providerKeys = storage[provider];

        if (!providerKeys || providerKeys.keys.length === 0) {
            return null;
        }

        return providerKeys.keys[providerKeys.currentIndex]?.key || null;
    }

    async resetProvider(provider: string): Promise<void> {
        const storage = await this.getStorage();
        delete storage[provider];
        await this.saveStorage(storage);
    }

    async resetAll(): Promise<void> {
        await this.saveStorage({});
    }

    async getKeyCount(provider: string): Promise<number> {
        const keys = await this.getKeys(provider);
        return keys.length;
    }

    // Get all keys as masked for display
    async getKeysForDisplay(provider: string): Promise<{ label: string; masked: string; lastUsed?: number }[]> {
        const keys = await this.getKeys(provider);
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
