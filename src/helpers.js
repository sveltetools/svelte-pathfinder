/*eslint no-extra-boolean-cast: "off"*/
/*eslint no-cond-assign: "off"*/
/*eslint no-useless-escape: "off"*/
/*eslint no-prototype-builtins: "off"*/

export function pattern(route = '') {
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

export function parseQuery(str = '') {
	return str ? str.replace('?', '')
		.replace(/\+/g, ' ')
		.split('&')
		.filter(Boolean)
		.reduce((obj, p) => {
			let [key, val] = p.split('=');
			key = decodeURIComponent(key || '');
			val = decodeURIComponent(val || '');

			let o = parseKeys(key, val);
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

export function stringifyQuery(obj = {}) {
	const qs = Object.keys(obj)
		.reduce((a, k) => {
			if (obj.hasOwnProperty(k) && isNaN(parseInt(k, 10))) {
				a.push(k + '=' + encodeURIComponent(obj[k]));
			}
			return a;
		}, [])
		.join('&');
	return qs ? `?${qs}` : '';
}

function parseParams(str, loose) {
	let arr = str.split('/'),
		keys = [],
		pattern = '',
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

function convertType(val) {
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

function parseKeys(key, val, depth = 1) {
	const brackets = /(\[[^[\]]*])/, child = /(\[[^[\]]*])/g;

	let seg = brackets.exec(key),
		parent = seg ? key.slice(0, seg.index) : key,
		keys = [];

	parent && keys.push(parent);

	let i = 0;
	while ((seg = child.exec(key)) && i < depth) {
		i++;
		keys.push(seg[1]);
	}

	seg && keys.push('[' + key.slice(seg.index) + ']');

	return parseObject(keys, val);
}

function parseObject(chain, val) {
	let leaf = val;

	for (let i = chain.length - 1; i >= 0; --i) {
		let root = chain[i], obj;

		if (root === '[]') {
			obj = [].concat(leaf);
		} else {
			obj = {};
			const key = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root,
				j = parseInt(key, 10);
			if (!isNaN(j) && root !== key && String(j) === key && j >= 0) {
				obj = [];
				obj[j] = leaf;
			} else {
				obj[key] = leaf;
			}
		}
		leaf = obj;
	}

	return leaf;
}
