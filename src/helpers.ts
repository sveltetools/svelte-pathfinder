/*eslint no-extra-boolean-cast: "off"*/
/*eslint no-cond-assign: "off"*/
/*eslint no-useless-escape: "off"*/
/*eslint no-prototype-builtins: "off"*/

type AutoConvert = boolean | null | number | string | undefined;

interface ParsedParams {
	keys: string[]
	pattern: RegExp
}

export function pattern(route: string = ''): boolean {
	const { pattern, keys } = parseParams(route);

	const pathname = this.toString(),
		matches = pattern.exec(pathname);

	if (matches) {
		const params = keys.reduce((p, k, i) => {
			p[k] = convertType(matches[++i]) || null;
			return p;
		}, {});
		Object.assign(this, params);
	}

	return !!matches;
}

export function parseQuery(str: string = '', deep: number = 1) {
	return str ? str.replace('?', '')
		.replace(/\+/g, ' ')
		.split('&')
		.filter(Boolean)
		.reduce((obj, p) => {
			let [key, val] = p.split('=');
			key = decodeURIComponent(key || '');
			val = decodeURIComponent(val || '');

			let o = parseKeys(key, val, deep);
			obj = Object.keys(o).reduce((obj, key) => {
				if (obj[key]) {
					Array.isArray(obj[key]) ?
						obj[key] = obj[key].concat(o[key]) :
						Object.assign(obj[key], o[key]);
				} else {
					obj[key] = convertType(o[key]);
				}
				return obj;
			}, obj);

			return obj;
		}, {}) : {};
}

export function stringifyQuery(obj: object = {}, deep: number = 1) {
	const qs = Object.keys(obj)
		.reduce((a, k) => {
			if (obj.hasOwnProperty(k) && isNaN(parseInt(k, 10))) {
				if (Array.isArray(obj[k])) {
					obj[k].forEach(v => {
						a.push(k + '[]=' + encodeURIComponent(v));
					})
				} else if (typeof obj[k] === 'object' && obj[k] !== null) {
					let o = parseKeys(k, obj[k], deep);
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

function parseParams(str: string, loose: boolean = false): ParsedParams {
	let arr: string[] = str.split('/'),
		keys: string[] = [],
		pattern: string = '',
		c, o, tmp, ext;

	arr[0] || arr.shift();

	while (tmp = arr.shift()) {
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
		pattern: new RegExp('^' + pattern + (loose ? '(?:$|\/)' : '\/?$'), 'i')
	};
}

function convertType(val: string): AutoConvert {
	if (val === 'true' || val === 'false') {
		return Boolean(val);
	} else if (val === 'null') {
		return null;
	} else if (val === 'undefined') {
		return undefined;
	} else if (val !== '' && !isNaN(Number(val))) {
		return Number(val);
	}
	return val;
}

function parseKeys(key: string, val: any, depth: number = 1): {} {
	const brackets = /(\[[^[\]]*])/, child = /(\[[^[\]]*])/g;

	let seg = brackets.exec(key),
		parent = seg ? key.slice(0, seg.index) : key,
		keys: string[] = [];

	parent && keys.push(parent);

	let i: number = 0;
	while ((seg = child.exec(key)) && i < depth) {
		i++;
		keys.push(seg[1]);
	}

	seg && keys.push('[' + key.slice(seg.index) + ']');

	return parseObject(keys, val);
}

function parseObject(chain: string[], val: any): {} {
	let leaf = val;

	for (let i: number = chain.length - 1; i >= 0; --i) {
		let root = chain[i], obj;

		if (root === '[]') {
			obj = [].concat(leaf);
		} else {
			obj = {};
			const key = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root,
				j = parseInt(key, 10);
			if (!isNaN(j) && root !== key && String(j) === key && j >= 0) {
				obj = [];
				obj[j] = convertType(leaf);
			} else {
				obj[key] = leaf;
			}
		}
		leaf = obj;
	}

	return leaf;
}

function stringifyObject(obj: {} = {}, nesting: string = ''): string {
	return Object.entries(obj).map(([key, val]) => {
		if (typeof val === 'object') {
			return stringifyObject(val, nesting ? nesting + `[${key}]` : key);
		} else {
			return [nesting + `[${key}]`, val].join('=');
		}
	}).join('&');
}
