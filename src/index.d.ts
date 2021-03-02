import { Writable, Readable } from 'svelte/store';
interface SubmitEvent extends Event {
    submitter: HTMLElement;
}
interface Prefs {
    array: {
        separator: string;
        format: 'bracket' | 'separator';
    };
    convertTypes: boolean;
    nesting: number;
    sideEffect: boolean;
}

declare const prefs: Prefs;
declare const path: Writable<String>;
declare const query: Writable<String>;
declare const fragment: Writable<string>;
declare const state: Writable<{}>;
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
