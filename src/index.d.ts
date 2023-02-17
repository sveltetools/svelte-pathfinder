import { Writable, Readable } from 'svelte/store';

interface SubmitEvent extends Event {
    submitter: HTMLElement;
}

interface ParseParamsOptions {
    loose?: boolean;
    sensitive?: boolean;
    decode?: typeof decodeURIComponent;
}

export interface Prefs {
    array: {
        separator: string;
        format: 'bracket' | 'separator';
    };
    convertTypes: boolean;
    hashbang: boolean;
    basePath: string;
    nesting: number;
    sideEffect: boolean;
}

declare const prefs: Prefs;
declare const path: Writable<[]>;
declare const query: Writable<{}>;
declare const fragment: Writable<string>;
declare const state: Writable<{}>;
declare const url: Readable<string>;
declare const pattern: Readable<
    <T extends {}>(pattern?: string, options?: ParseParamsOptions) => T | null
>;

declare function goto(url?: string, data?: {}): void;
declare function redirect(url?: string, data?: {}): void;
declare function back(pathname?: string): void;
declare function click(e: MouseEvent): void;
declare function submit(e: SubmitEvent): void;

declare function paramable<T extends {}>(
    pattern?: string,
    options?: ParseParamsOptions
): Writable<T>;

export {
    paramable,
    redirect,
    fragment,
    pattern,
    submit,
    click,
    prefs,
    state,
    query,
    path,
    back,
    goto,
    url,
};
