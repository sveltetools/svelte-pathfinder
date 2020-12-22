export declare const pathStore: (value: any) => {
    subscribe: (run: (value: any) => void, invalidate?: (value?: any) => void) => () => void;
    update: (reducer: any) => void;
    set: (value: any) => void;
};
export declare const queryStore: (value: any) => {
    subscribe: (run: (value: any) => void, invalidate?: (value?: any) => void) => () => void;
    update: (reducer: any) => void;
    set: (value: any) => void;
};
