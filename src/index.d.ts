import { Writable, Readable } from 'svelte/store';
interface SubmitEvent extends Event {
    submitter: HTMLElement;
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

export type Param =
    | boolean
    | null
    | undefined
    | number
    | string
    | Param[]
    | Params;

export interface Params {
    [key: string]: Param;
}

export interface StringParams extends String {
    params: Params;
}

declare const prefs: Prefs;
declare const path: Writable<StringParams>;
declare const query: Writable<StringParams>;
declare const fragment: Writable<string>;
declare const state: Writable<Params>;
declare const url: Readable<string>;
declare const pattern: Readable<(math?: string, loose?: boolean) => boolean>;
declare function goto(url?: string, data?: {}): void;
declare function back(pathname?: string): void;
declare function click(e: MouseEvent): void;
declare function submit(e: SubmitEvent): void;

export {
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
