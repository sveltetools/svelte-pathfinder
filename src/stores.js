import { writable, get } from 'svelte/store';

import {
	stringifyQuery,
	prependPrefix,
	injectParams,
	parseParams,
	parseQuery,
	shallowCopy,
	trimPrefix,
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
	return (pattern, options = {}) => {
		let params;

		const { subscribe } = writable({}, (set) => {
			return path.subscribe(($path) => {
				params = parseParams($path.toString(), pattern, { blank: true, ...options });
				set(shallowCopy(params));
			});
		});

		function set(value = {}) {
			if (Object.entries(params).some(([key, val]) => val !== value[key])) {
				path.set(injectParams(pattern, value));
			}
		}

		return {
			get() {
				return get(this);
			},
			update(fn) {
				set(fn(this.get()));
			},
			subscribe,
			set,
		};
	};
}

function createStore(normalize, start) {
	return (value) => {
		const { subscribe, set } = writable(normalize(value), start);

		function _set(value, prevValue) {
			value = normalize(value, prevValue);
			if (value !== prevValue) set(value);
		}

		return {
			subscribe,
			update(fn) {
				const value = get(this);
				_set(fn(shallowCopy(value)), value);
			},
			set(value) {
				_set(value, get(this));
			},
		};
	};
}
