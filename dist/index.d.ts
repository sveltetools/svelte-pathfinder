import { prefs } from './shared';
interface SubmitEvent extends Event {
    submitter: HTMLElement;
}
declare const path: {
    subscribe: (run: (value: any) => void, invalidate?: (value?: any) => void) => () => void;
    update: (reducer: any) => void;
    set: (value: any) => void;
};
declare const query: {
    subscribe: (run: (value: any) => void, invalidate?: (value?: any) => void) => () => void;
    update: (reducer: any) => void;
    set: (value: any) => void;
};
declare const fragment: import("svelte/store").Writable<string>;
declare const state: import("svelte/store").Writable<{}>;
declare const url: import("svelte/store").Readable<string>;
declare function goto(url: string, data: {}): void;
declare function back(pathname?: string): void;
declare function click(e: MouseEvent): void;
declare function submit(e: SubmitEvent): void;
export { fragment, submit, click, prefs, state, query, path, back, goto, url, };
