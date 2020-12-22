export declare const specialLinks: RegExp;
export declare const hasLocation: boolean;
export declare const hasProcess: boolean;
export declare const sideEffect: boolean;
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
