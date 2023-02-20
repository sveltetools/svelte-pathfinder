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

export function pathStore(value = '') {
	let pathString = value.toString();

	function normalize($path) {
		if (typeof $path === 'string') $path = trimPrefix($path, '/').split('/');

		return !Object.prototype.hasOwnProperty.call($path, 'toString')
			? Object.defineProperty($path, 'toString', {
					value() {
						return prependPrefix(this.join('/'));
					},
					configurable: false,
					writable: false,
			  })
			: $path;
	}

	const { subscribe, set } = writable(normalize(value));

	function _set(value) {
		value = normalize(value);
		if (value.toString() !== pathString) {
			pathString = value.toString();
			set(value);
		}
	}

	return {
		subscribe,
		update(fn) {
			_set(fn(get(this)));
		},
		set(value) {
			_set(value);
		},
	};
}

export const queryStore = createInvariantStore(($query) => {
	if (typeof $query === 'string') $query = parseQuery($query);
	return !Object.prototype.hasOwnProperty.call($query, 'toString')
		? Object.defineProperty($query, 'toString', {
				value() {
					return stringifyQuery(this);
				},
				configurable: false,
				writable: false,
		  })
		: $query;
});

export const fragmentStore = createInvariantStore(($fragment) => trimPrefix($fragment, '#'));

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

function createInvariantStore(normalize) {
	return (value) => {
		const { subscribe, update, set } = writable(normalize(value));

		return {
			subscribe,
			update: (fn) => update((value) => normalize(fn(value))),
			set: (value) => set(normalize(value)),
		};
	};
}
