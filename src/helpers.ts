/*eslint no-extra-boolean-cast: "off"*/
/*eslint no-cond-assign: "off"*/
/*eslint no-useless-escape: "off"*/
/*eslint no-prototype-builtins: "off"*/

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
			p[k] = convertType(matches[++i], {
				array: { separator: '|', format: 'separator' }
			}) || null;
			return p;
		}, {});
		Object.assign(this, params);
	}

	return !!matches;
}

export function parseQuery(str: string = '', params) {
	return str ? str.replace('?', '')
		.replace(/\+/g, ' ')
		.split('&')
		.filter(Boolean)
		.reduce((obj, p) => {
			let [key, val] = p.split('=');
			key = decodeURIComponent(key || '');
			val = decodeURIComponent(val || '');

			let o = parseKeys(key, val, params);
			obj = Object.keys(o).reduce((obj, key) => {
				if (obj[key]) {
					Array.isArray(obj[key]) ?
						obj[key] = obj[key].concat(convertType(o[key], params)) :
						Object.assign(obj[key], convertType(o[key], params));
				} else {
					obj[key] = convertType(o[key], params);
				}
				return obj;
			}, obj);

			return obj;
		}, {}) : {};
}

export function stringifyQuery(obj = {}, params) {
	const qs = Object.keys(obj)
		.reduce((a, k) => {
			if (obj.hasOwnProperty(k) && isNaN(parseInt(k, 10))) {
				if (Array.isArray(obj[k])) {
					if (params.array.format === 'separator') {
						a.push(k + '=' + obj[k].join(params.array.separator));
					} else {
						obj[k].forEach(v => a.push(k + '[]=' + encodeURIComponent(v)));
					}
				} else if (typeof obj[k] === 'object' && obj[k] !== null) {
					let o = parseKeys(k, obj[k], params);
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

function convertType(val, params) {
	if (Array.isArray(val)) {
		val[val.length - 1] = convertType(val[val.length - 1], params);
		return val;
	} else if (typeof val === 'object') {
		return Object.entries(val).reduce((obj, [k, v]) => {
			obj[k] = convertType(v, params);
			return obj;
		}, {});
	}
	if (val === 'true' || val === 'false') {
		return Boolean(val);
	} else if (val === 'null') {
		return null;
	} else if (val === 'undefined') {
		return undefined;
	} else if (val !== '' && !isNaN(Number(val))) {
		return Number(val);
	} else if (params.array.format === 'separator' && typeof val === 'string') {
		const arr = val.split(params.array.separator);
		return arr.length ? arr : val;
	}
	return val;
}

function parseKeys(key: string, val: any, params): {} {
	const brackets = /(\[[^[\]]*])/, child = /(\[[^[\]]*])/g;

	let seg = brackets.exec(key),
		parent = seg ? key.slice(0, seg.index) : key,
		keys: string[] = [];

	parent && keys.push(parent);

	let i: number = 0;
	while ((seg = child.exec(key)) && i < params.nesting) {
		i++;
		keys.push(seg[1]);
	}

	seg && keys.push('[' + key.slice(seg.index) + ']');

	return parseObject(keys, val, params);
}

function parseObject(chain: string[], val: any, params): {} {
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
				obj[j] = convertType(leaf, params);
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
