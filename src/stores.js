import { writable } from 'svelte/store';

import { stringifyQuery, parseQuery } from './shared';

export const pathStore = createStore((path) => {
	return typeof path === 'string' ? new String(path) : path;
});

export const queryStore = createStore((query) => {
	if (typeof query !== 'string') query = stringifyQuery(query.params);
	return Object.assign(new String(query), { params: parseQuery(query) });
});

function createStore(create) {
	return (value) => {
		const { subscribe, update, set } = writable(create(value));

		return {
			subscribe,
			update: (reducer) => update((value) => create(reducer(value))),
			set: (value) => set(create(value)),
		};
	};
}
