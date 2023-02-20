import { writable, get } from 'svelte/store';

import {
	stringifyQuery,
	parseQuery,
	parseParams,
	trimPrefix,
	prependPrefix,
	shallowCopy,
} from './shared';

export const pathStore = createStore(($path, $prev) => {
	if ($prev && $path.toString() === $prev.toString()) return $prev;

	return typeof $path === 'string'
		? Object.defineProperty(trimPrefix($path, '/').split('/'), 'toString', {
				value() {
					return prependPrefix(this.join('/'));
				},
				configurable: false,
				writable: false,
		  })
		: $path;
});

export const queryStore = createStore(($query) => {
	return typeof $query === 'string'
		? Object.defineProperty(parseQuery($query), 'toString', {
				value() {
					return stringifyQuery(this);
				},
				configurable: false,
				writable: false,
		  })
		: $query;
});

export const fragmentStore = createStore(($fragment) => trimPrefix($fragment, '#'));

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

function createStore(normalize, start) {
	return (value) => {
		const { subscribe, set } = writable(normalize(value), start);
		return {
			subscribe,
			update(reducer) {
				const prevValue = get(this);
				value = normalize(reducer(shallowCopy(prevValue)), prevValue);
				if (value !== prevValue) set(value);
			},
			set(value) {
				const prevValue = get(this);
				value = normalize(value, prevValue);
				if (value !== prevValue) set(value);
			},
		};
	};
}
