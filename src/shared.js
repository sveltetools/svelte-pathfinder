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

	return prependPrefix(path);
}

export function getLocation() {
	if (!hasLocation) return {};

	if (prefs.hashbang || useHashbang) {
		const hash = location.hash;
		return new URL(
			hash.indexOf(hashbang) === 0 ? hash.substring(2) : hash.substring(1),
			'file:'
		);
	}

	return location;
}

export function getBase() {
	if (prefs.basePath) return prefs.basePath;
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
	return prependPrefix(url);
}

export function isButton(el) {
	const tagName = el.tagName.toLowerCase();
	const type = el.type && el.type.toLowerCase();
	return (
		tagName === 'button' ||
		(tagName === 'input' && ['button', 'submit', 'image'].includes(type))
	);
}

export function closest(el, tagName) {
	while (el && el.nodeName.toLowerCase() !== tagName) el = el.parentNode;
	return !el || el.nodeName.toLowerCase() !== tagName ? null : el;
}

export function parseQuery(str = '', { decode = decodeURIComponent } = {}) {
	return str
		? str
				.replace('?', '')
				.replace(/\+/g, ' ')
				.split('&')
				.filter(Boolean)
				.reduce((obj, p) => {
					let [key, val] = p.split(/=(.*)/, 2);
					key = decode(key || '');
					val = decode(val || '');

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

export function stringifyQuery(obj = {}, { encode = encodeURIComponent } = {}) {
	const qs = Object.keys(obj)
		.reduce((a, k) => {
			if (Object.prototype.hasOwnProperty.call(obj, k) && isNaN(parseInt(k, 10))) {
				if (Array.isArray(obj[k])) {
					if (prefs.array.format === 'separator') {
						a.push(k + '=' + obj[k].join(prefs.array.separator));
					} else {
						obj[k].forEach((v) => a.push(k + '[]=' + encode(v)));
					}
				} else if (typeof obj[k] === 'object' && obj[k] !== null) {
					let o = parseKeys(k, obj[k]);
					a.push(stringifyObject(o));
				} else {
					a.push(k + '=' + encode(obj[k]));
				}
			}
			return a;
		}, [])
		.join('&');
	return qs ? `?${qs}` : '';
}

export function parseParams(
	path = '',
	pattern = '*',
	{ loose = false, sensitive = false, decode = decodeURIComponent } = {}
) {
	const pos = [];
	const rgx = pattern.split('/').reduce((rgx, seg, i, { length }) => {
		if (seg) {
			const pfx = seg[0];
			if (pfx === '*') {
				pos.push('wild');
				rgx += '/(?<wild>.*)';
			} else if (pfx === ':') {
				const opt = seg.indexOf('?', 1);
				const ext = seg.indexOf('.', 1);
				const isOpt = !!~opt;
				const isExt = !!~ext;

				const key = seg.substring(1, isOpt ? opt : isExt ? ext : seg.length);
				pos.push(key);

				rgx += isOpt && !isExt ? '(?:/(?<' + key + '>[^/]+?))?' : '/(?<' + key + '>[^/]+?)';
				if (isExt) rgx += (isOpt ? '?' : '') + '\\' + seg.substring(ext);
			} else {
				pos.push(null);
				rgx += '/' + seg;
			}
		}

		if (i === length - 1) {
			rgx += loose ? '(?:$|/)' : '/?$';
		}

		return rgx;
	}, '^');

	const flags = sensitive ? '' : 'i';

	const matches = new RegExp(rgx, flags).exec(path);

	if (!matches) return [null, pos];

	const params = Object.entries(matches.groups || {}).reduce((params, [key, val]) => {
		const value = decode(val);
		params[key] = prefs.convertTypes ? convertType(value) : value;
		return params;
	}, {});

	return [params, pos];
}

export function prependPrefix(str, pfx = '/') {
	return (str + '').indexOf(pfx) !== 0 ? pfx + str : str;
}

export function trimPrefix(str, pfx) {
	return (str + '').indexOf(pfx) === 0 ? str.substring(pfx.length) : str;
}

export function shallowCopy(value) {
	if (typeof value !== 'object' || value === null) return value;
	return Object.create(Object.getPrototypeOf(value), Object.getOwnPropertyDescriptors(value));
}

export function listenEvent(...args) {
	window.addEventListener(...args);
	return () => window.removeEventListener(...args);
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
	} else if (val !== '' && !isNaN(Number(val)) && Number(val).toString() === val) {
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
