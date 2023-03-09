import { writable, get } from 'svelte/store';

import {
	stringifyQuery,
	normalizeHash,
	prependPrefix,
	hookLauncher,
	injectParams,
	parseParams,
	parseQuery,
	shallowCopy,
	trimPrefix,
	isFn,
} from './utils';

export const pathable = createParsableStore(function path($path = '') {
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
});

export const queryable = createParsableStore(function query($query = '') {
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

export const fragmentable = createParsableStore(function fragment($fragment = '') {
	return normalizeHash($fragment);
});

export function createParamStore(path) {
	return (pattern, options = {}) => {
		let params;

		pattern = pattern.replace(/\/$/, '');

		const { subscribe } = writable({}, (set) => {
			return path.subscribe(($path) => {
				params = parseParams($path.toString(), pattern, { blank: true, ...options });
				set(shallowCopy(params));
			});
		});

		function set(value = {}) {
			if (Object.entries(params).some(([key, val]) => val !== value[key])) {
				path.update(($path) => {
					const tail = options.loose
						? prependPrefix($path.slice(pattern.split('/').length - 1).join('/'))
						: '';
					return injectParams(pattern + tail, value);
				});
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

function createParsableStore(parse) {
	return (value, cbx) => {
		let serialized = value && value.toString();

		!Array.isArray(cbx) && (cbx = [cbx]);

		const hooks = new Set(cbx);
		const runHooks = hookLauncher(hooks);

		const { subscribe, set } = writable((value = parse(value)), () => () => hooks.clear());

		function update(val) {
			val = parse(val);
			if (val.toString() !== serialized && runHooks(val, value, parse.name) !== false) {
				serialized = val.toString();
				value = val;
				set(value);
			}
		}

		runHooks(null, value, parse.name);

		return {
			subscribe,
			update(fn) {
				update(fn(get(this)));
			},
			set(value) {
				update(value);
			},
			hook(cb) {
				if (isFn(cb)) {
					hooks.add(cb);
					cb(null, value, parse.name);
				}
				return () => hooks.delete(cb);
			},
		};
	};
}
