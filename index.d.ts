interface SubmitEvent extends Event {
    submitter: HTMLElement;
}
export interface Prefs {
    query: {
        array: {
            separator: string;
            format: 'bracket' | 'separator';
        };
        nesting: number;
        [key: string]: any;
    };
    sideEffect: boolean;
}
export declare const prefs: Prefs;
export declare const path: {
    subscribe: (run: (value: any) => void, invalidate?: (value?: any) => void) => () => void;
    update: (reducer: any) => void;
    set: (value: any) => void;
};
export declare const query: {
    subscribe: (run: (value: any) => void, invalidate?: (value?: any) => void) => () => void;
    update: (reducer: any) => void;
    set: (value: any) => void;
};
export declare const fragment: import("svelte/store").Writable<string>;
export declare const state: import("svelte/store").Writable<{}>;
export declare const url: import("svelte/store").Readable<string>;
export declare function goto(url: string, data: {}): void;
export declare function back(pathname?: string): void;
export declare function click(e: MouseEvent): void;
export declare function submit(e: SubmitEvent): void;
export {};
