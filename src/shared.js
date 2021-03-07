/*eslint no-extra-boolean-cast: "off"*/
/*eslint no-cond-assign: "off"*/
/*eslint no-useless-escape: "off"*/
/*eslint no-prototype-builtins: "off"*/

export const specialLinks = /((mailto:\w+)|(tel:\w+)).+/;
export const hasLocation = typeof location !== 'undefined';
export const hasProcess = typeof process !== 'undefined';
export const hasHistory = typeof history !== 'undefined';
export const hasPushState = hasHistory && typeof history.pushState === 'function';
export const hasWindow = typeof window !== 'undefined';
export const isSubWindow = hasWindow && window !== window.parent;
export const isFileScheme =
	hasLocation && (location.protocol === 'file:' || /[-_\w]+[.][\w]+$/i.test(location.pathname));
export const sideEffect = hasWindow && hasHistory && hasLocation && !isSubWindow;

export const useHashbang = !hasPushState || isFileScheme;

const hashbang = '#!';

export const prefs = {
	array: {
		separator: ',',
		format: 'bracket',
	},
	convertTypes: true,
	hashbang: false,
	basePath: '',
	nesting: 3,
	sideEffect,
};

export function getPath() {
	const pathname = getLocation().pathname;
	if (!pathname) return '';

	const base = getBase();
	const path = trimPrefix(pathname, base);

	return prependSlash(path);
}

export function getLocation() {
	if (!hasLocation) return {};

	if (prefs.hashbang || useHashbang) {
		const hash = location.hash;
		return new URL(hash.indexOf(hashbang) === 0 ? hash.substring(2) : hash.substring(1), 'file:');
	}

	return location;
}

export function getBase() {
	if (!!prefs.basePath) return prefs.basePath;
	if (hasLocation && (prefs.hashbang || useHashbang)) return location.pathname;
	return '/';
}

export function getFullURL(url) {
	(prefs.hashbang || useHashbang) && (url = hashbang + url);
	const base = getBase();
	return (base[base.length - 1] === '/' ? base.substring(0, base.length - 1) : base) + url;
}

export function getShortURL(url) {
	url = trimPrefix(url, location.origin);

	const base = getBase();
	url = trimPrefix(url, base);

	(prefs.hashbang || useHashbang) && (url = trimPrefix(url, hashbang));
	return prependSlash(url);
}

export function isButton(el) {
	const tagName = el.tagName.toLocaleLowerCase();
	const type = el.type && el.type.toLocaleLowerCase();
	return (
		tagName === 'button' ||
		(tagName === 'input' && ['button', 'submit', 'image'].includes(type))
	);
}

export function matchPattern(str, match, loose) {
	const { pattern, keys } = parseParams(match, loose);
	const matches = pattern.exec(str);

	if (!matches) return null;

	return keys.reduce((p, k, i) => {
		p[k] = (prefs.convertTypes ? convertType(matches[++i]) : matches[++i]) || null;
		return p;
	}, {});
}

export function parseQuery(str = '') {
	return str
		? str
				.replace('?', '')
				.replace(/\+/g, ' ')
				.split('&')
				.filter(Boolean)
				.reduce((obj, p) => {
					let [key, val] = p.split(/=(.*)/, 2);
					key = decodeURIComponent(key || '');
					val = decodeURIComponent(val || '');

					let o = parseKeys(key, val);
					obj = Object.keys(o).reduce((obj, key) => {
						const val = prefs.convertTypes ? convertType(o[key]) : o[key];
						if (obj[key]) {
							Array.isArray(obj[key])
								? (obj[key] = obj[key].concat(val))
								: Object.assign(obj[key], val);
						} else {
							obj[key] = val;
						}
						return obj;
					}, obj);

					return obj;
				}, {})
		: {};
}

export function stringifyQuery(obj = {}) {
	const qs = Object.keys(obj)
		.reduce((a, k) => {
			if (obj.hasOwnProperty(k) && isNaN(parseInt(k, 10))) {
				if (Array.isArray(obj[k])) {
					if (prefs.array.format === 'separator') {
						a.push(k + '=' + obj[k].join(prefs.array.separator));
					} else {
						obj[k].forEach((v) => a.push(k + '[]=' + encodeURIComponent(v)));
					}
				} else if (typeof obj[k] === 'object' && obj[k] !== null) {
					let o = parseKeys(k, obj[k]);
					a.push(stringifyObject(o));
				} else {
					a.push(k + '=' + encodeURIComponent(obj[k]));
				}
			}
			return a;
		}, [])
		.join('&');
	return qs ? `?${qs}` : '';
}

export function prependSlash(str) {
	return str[0] !== '/' ? '/' + str : str;
}

function trimPrefix(str, prefix) {
	return str.indexOf(prefix) === 0 ? str.substring(prefix.length) : str;
}

function parseParams(str, loose = false) {
	let arr = str.split('/'),
		keys = [],
		pattern = '',
		c,
		o,
		tmp,
		ext;

	arr[0] || arr.shift();

	while ((tmp = arr.shift())) {
		c = tmp[0];
		if (c === '*') {
			keys.push('wild');
			pattern += '/(.*)';
		} else if (c === ':') {
			o = tmp.indexOf('?', 1);
			ext = tmp.indexOf('.', 1);
			keys.push(tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length));
			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
		} else {
			pattern += '/' + tmp;
		}
	}

	return {
		keys,
		pattern: new RegExp('^' + pattern + (loose ? '(?:$|/)' : '/?$'), 'i'),
	};
}

function convertType(val) {
	if (Array.isArray(val)) {
		val[val.length - 1] = convertType(val[val.length - 1]);
		return val;
	} else if (typeof val === 'object') {
		return Object.entries(val).reduce((obj, [k, v]) => {
			obj[k] = convertType(v);
			return obj;
		}, {});
	}

	if (val === 'true' || val === 'false') {
		return val === 'true';
	} else if (val === 'null') {
		return null;
	} else if (val === 'undefined') {
		return undefined;
	} else if (val !== '' && !isNaN(Number(val))) {
		return Number(val);
	} else if (prefs.array.format === 'separator' && typeof val === 'string') {
		const arr = val.split(prefs.array.separator);
		return arr.length > 1 ? arr : val;
	}
	return val;
}

function parseKeys(key, val) {
	const brackets = /(\[[^[\]]*])/,
		child = /(\[[^[\]]*])/g;

	let seg = brackets.exec(key),
		parent = seg ? key.slice(0, seg.index) : key,
		keys = [];

	parent && keys.push(parent);

	let i = 0;
	while ((seg = child.exec(key)) && i < prefs.nesting) {
		i++;
		keys.push(seg[1]);
	}

	seg && keys.push('[' + key.slice(seg.index) + ']');

	return parseObject(keys, val);
}

function parseObject(chain, val) {
	let leaf = val;

	for (let i = chain.length - 1; i >= 0; --i) {
		let root = chain[i],
			obj;

		if (root === '[]') {
			obj = [].concat(leaf);
		} else {
			obj = {};
			const key =
					root.charAt(0) === '[' && root.charAt(root.length - 1) === ']'
						? root.slice(1, -1)
						: root,
				j = parseInt(key, 10);
			if (!isNaN(j) && root !== key && String(j) === key && j >= 0) {
				obj = [];
				obj[j] = prefs.convertTypes ? convertType(leaf) : leaf;
			} else {
				obj[key] = leaf;
			}
		}
		leaf = obj;
	}

	return leaf;
}

function stringifyObject(obj = {}, nesting = '') {
	return Object.entries(obj)
		.map(([key, val]) => {
			if (typeof val === 'object') {
				return stringifyObject(val, nesting ? nesting + `[${key}]` : key);
			} else {
				return [nesting + `[${key}]`, val].join('=');
			}
		})
		.join('&');
}
