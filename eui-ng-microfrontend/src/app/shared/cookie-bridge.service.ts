import { Injectable } from '@angular/core';

export type CookieOptions = {
    path?: string;
    domain?: string;
    maxAge?: number;
    expires?: Date;
    secure?: boolean;
    sameSite?: 'Lax' | 'Strict' | 'None';
};

type CookieBridgeGlobal = {
    set(name: string, value: string, options?: CookieOptions): void;
    get(name: string): string | null;
    getAll(): Record<string, string>;
    remove(name: string, options?: CookieOptions): void;
};

const DEFAULT_OPTIONS: CookieOptions = {
    path: '/',
    sameSite: 'Lax',
};

@Injectable({ providedIn: 'root' })
export class CookieBridgeService {
    private get globalBridge(): CookieBridgeGlobal | undefined {
        return (window as unknown as { cookieBridge?: CookieBridgeGlobal }).cookieBridge;
    }

    set(name: string, value: string, options?: CookieOptions): void {
        if (this.globalBridge?.set) {
            this.globalBridge.set(name, value, options);
            return;
        }
        this.writeToDocument(name, value, options);
    }

    get(name: string): string | null {
        if (this.globalBridge?.get) {
            return this.globalBridge.get(name);
        }
        return this.readFromDocument()[name] ?? null;
    }

    getAll(): Record<string, string> {
        if (this.globalBridge?.getAll) {
            return this.globalBridge.getAll();
        }
        return this.readFromDocument();
    }

    remove(name: string, options?: CookieOptions): void {
        if (this.globalBridge?.remove) {
            this.globalBridge.remove(name, options);
            return;
        }
        this.writeToDocument(name, '', {
            ...(options || {}),
            maxAge: 0,
            expires: new Date(0),
        });
    }

    /**
     * Convenience helper for demos/tests so we can prove cookie sharing works.
     */
    ensureSampleCookie(): void {
        if (!this.get('mfe-sample')) {
            this.set('mfe-sample', 'angular-mfe', { path: '/' });
        }
    }

    private readFromDocument(): Record<string, string> {
        const raw = document.cookie || '';
        return raw
            .split(';')
            .map((cookie) => cookie.trim())
            .filter(Boolean)
            .reduce<Record<string, string>>((acc, cookie) => {
                const [name, ...rest] = cookie.split('=');
                const value = rest.join('=');
                acc[decodeURIComponent(name)] = decodeURIComponent(value);
                return acc;
            }, {});
    }

    private writeToDocument(name: string, value: string, options?: CookieOptions): void {
        const resolved = { ...DEFAULT_OPTIONS, ...(options || {}) };
        let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=${resolved.path}`;

        if (resolved.domain) {
            cookie += `; Domain=${resolved.domain}`;
        }
        if (typeof resolved.maxAge === 'number') {
            cookie += `; Max-Age=${resolved.maxAge}`;
        }
        if (resolved.expires instanceof Date) {
            cookie += `; Expires=${resolved.expires.toUTCString()}`;
        }
        if (resolved.secure) {
            cookie += '; Secure';
        }
        if (resolved.sameSite) {
            cookie += `; SameSite=${resolved.sameSite}`;
        }

        document.cookie = cookie;
    }
}

