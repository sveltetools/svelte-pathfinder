import { writable } from 'svelte/store';

import { pattern, stringifyQuery, parseQuery } from './helpers';
import { prefs } from './index';

export const pathStore = createStore(path => {
	if (!(path instanceof String)) path = new String(path);
	return Object.assign(path, { pattern });
});

export const queryStore = createStore(query => {
	const nesting = prefs.query.nesting;
	if (typeof query !== 'string') query = stringifyQuery(query, nesting);
	return Object.assign(new String(query), parseQuery(query, nesting));
});

function createStore(create) {
	return value => {
		const { subscribe, update, set } = writable(create(value));

		return {
			subscribe,
			update: reducer => update(value => create(reducer(value))),
			set: value => set(create(value))
		};
	};
}
