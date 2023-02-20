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
    hashbang: boolean;
    basePath: string;
    nesting: number;
    sideEffect: boolean;
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
export declare const fragment: Writable<string>;
export declare const state: Writable<{ [key: string]: any }>;
export declare const url: Readable<string>;
export declare const pattern: Readable<
    <T extends {}>(pattern?: string, options?: ParseParamsOptions) => T | null
>;

export declare function goto(url?: string, data?: {}): void;
export declare function redirect(url?: string, data?: {}): void;
export declare function back(pathname?: string): void;
export declare function click(e: MouseEvent): void;
export declare function submit(e: SubmitEvent): void;

export declare function paramable<T extends {}>(
    pattern?: string,
    options?: ParseParamsOptions
): Writable<T>;
