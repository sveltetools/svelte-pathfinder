import { writable, get } from 'svelte/store';

import {
	stringifyQuery,
	parseQuery,
	parseParams,
	trimPrefix,
	prependPrefix,
	shallowCopy,
} from './shared';

export const pathStore = createStore((path) => {
	return typeof path === 'string'
		? Object.defineProperty(trimPrefix(path, '/').split('/'), 'toString', {
				value() {
					return prependPrefix(this.join('/'));
				},
				configurable: false,
				writable: false,
		  })
		: path;
});

export const queryStore = createStore((query) => {
	return typeof query === 'string'
		? Object.defineProperty(parseQuery(query), 'toString', {
				value() {
					return stringifyQuery(this);
				},
				configurable: false,
				writable: false,
		  })
		: query;
});

export function createParamStore(path) {
	return (pattern, options) => {
		let parsedParams;
		let paramPositions;

		const { subscribe } = writable({}, (set) => {
			return path.subscribe(($path) => {
				[parsedParams, paramPositions] = parseParams($path.toString(), pattern, options);
				if (!parsedParams) parsedParams = blankParams(paramPositions);
				set(shallowCopy(parsedParams));
			});
		});

		function set(value = {}) {
			const patchParams = Object.entries(value).reduce((patch, [key, val]) => {
				if (val !== parsedParams[key]) {
					patch.push([val, paramPositions.indexOf(key)]);
				}
				return patch;
			}, []);

			if (patchParams.length) {
				path.update(($path) => {
					patchParams.forEach(([param, i]) => {
						if (typeof param === 'undefined') {
							delete $path[i];
						} else {
							$path[i] = param;
						}
					});
					return $path;
				});
			}
		}

		function blankParams(keys = []) {
			return (keys || []).reduce((params, key) => {
				if (key) params[key] = undefined;
				return params;
			}, {});
		}

		return {
			get() {
				return get(this);
			},
			update(reducer) {
				set(reducer(shallowCopy(get(this))));
			},
			subscribe,
			set,
		};
	};
}

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
