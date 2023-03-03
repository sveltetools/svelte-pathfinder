import { Writable, Readable, Updater } from 'svelte/store';

export interface Parsable<T> extends Readable<T> {
    set(this: void, value: T | string): void;
    update(this: void, updater: Updater<T | string>): void;
}

export interface SubmitEvent extends Event {
    submitter: HTMLElement;
}

export interface ParseParamsOptions {
    loose?: boolean;
    sensitive?: boolean;
    blank?: boolean;
    decode?: typeof decodeURIComponent;
}

export interface Prefs {
    array: {
        separator: string;
        format: 'bracket' | 'separator';
    };
    convertTypes: boolean;
    breakHooks: boolean;
    hashbang: boolean;
    anchor: boolean | ScrollIntoViewOptions;
    scroll: boolean | ScrollIntoViewOptions;
    focus: boolean;
    nesting: number;
    sideEffect: boolean;
    base: string;
}

export type ConvertedParam =
    | string
    | boolean
    | number
    | {}
    | []
    | null
    | undefined;

export declare const prefs: Prefs;
export declare const path: Parsable<ConvertedParam[]>;
export declare const query: Parsable<{ [key: string]: ConvertedParam }>;
export declare const fragment: Parsable<string>;
export declare const state: Writable<{ [key: string]: any }>;
export declare const url: Readable<string>;
export declare const pattern: Readable<
    <T extends {}>(pattern?: string, options?: ParseParamsOptions) => T | null
>;

export declare function goto(url?: string | URL, data?: {}): void;
export declare function redirect(url?: string | URL, data?: {}): void;
export declare function back(url?: string | URL): void;
export declare function click(e: MouseEvent): void;
export declare function submit(e: SubmitEvent): void;

export declare function paramable<T extends {}>(
    pattern?: string,
    options?: ParseParamsOptions
): Writable<T>;
