import { tick } from 'svelte';
import { writable, derived } from 'svelte/store';

/*eslint no-extra-boolean-cast: "off"*/
/*eslint no-cond-assign: "off"*/
/*eslint no-useless-escape: "off"*/
/*eslint no-prototype-builtins: "off"*/

function pattern(route = '') {
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

function parseQuery(str = '') {
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

function stringifyQuery(obj = {}) {
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

const pathStore = createStore(path => {
	if (!(path instanceof String)) path = new String(path);
	return Object.assign(path, { pattern });
});

const queryStore = createStore(query => {
	if (typeof query !== 'string') query = stringifyQuery(query);
	return Object.assign(new String(query), parseQuery(query));
});

function createStore(create) {
	return value => {
		const { subscribe, update, set } = writable(create(value));

		return {
			subscribe,
			update: reducer => update(value => create(reducer(value))),
			set: value => set(create(value))
		};
	};
}

const specialLinks = /((mailto:\w+)|(tel:\w+)).+/;

const hasWindow = typeof window !== 'undefined',
	hasHistory = typeof history !== 'undefined',
	hasLocation = typeof location !== 'undefined',
	hasProcess = typeof process !== 'undefined',
	subWindow = hasWindow && window !== window.parent,
	sideEffect = hasWindow && hasHistory && !subWindow;

const pathname = hasLocation ? location.pathname : '',
	search = hasLocation ? location.search : '',
	hash = hasLocation ? location.hash : '';

let popstate = false,
	len = 0;

const path = pathStore(pathname);

const query = queryStore(search);

const fragment = writable(hash, set => {
	const handler = () => set(location.hash);
	sideEffect && window.addEventListener('hashchange', handler);
	return () => {
		sideEffect && window.removeEventListener('hashchange', handler);
	};
});

const state = writable({});

const url = derived(
	[path, query, fragment],
	([$path, $query, $fragment], set) => {

		let skip = false;

		tick().then(() => {
			if (skip) return;
			set($path.toString() + $query.toString() + $fragment.toString());
		});

		return () => skip = true;
	},
	pathname + search + hash
);

if (sideEffect) {
	url.subscribe($url => {
		if (popstate) return popstate = false;
		history.pushState({}, null, $url);
		len++;
	});

	state.subscribe($state => {
		const url = location.pathname + location.search + location.hash;
		history.replaceState($state, null, url);
	});

	window.addEventListener('popstate', e => {
		popstate = true;
		goto(location.href, e.state);
	});
}

function goto(url = '', data) {

	const { pathname, search, hash } = new URL(url, 'file:');

	path.set(pathname);
	query.set(search);
	fragment.set(hash);

	data && tick().then(() => state.set(data));
}

function back(pathname = '/') {
	if (len > 0 && sideEffect) {
		history.back();
		len--;
	} else {
		tick().then(() => path.set(pathname));
	}
}

function click(e = {}) {
	if (
		!e.target ||
		e.ctrlKey ||
		e.metaKey ||
		e.altKey ||
		e.shiftKey ||
		e.button ||
		e.which !== 1 ||
		e.defaultPrevented
	) return;

	const a = e.target.closest('a');
	if (!a || a.target || a.hasAttribute('download')) return;

	const url = a.href;
	if (!url || url.indexOf(location.origin) !== 0 || specialLinks.test(url)) return;

	e.preventDefault();
	goto(url, Object.assign({}, a.dataset));
}

function submit(e = {}) {
	if (!e.target || e.defaultPrevented) return;

	const form = e.target,
		btn = isButton(document.activeElement) && document.activeElement;

	let action = form.action,
		method = form.method,
		target = form.target;

	if (btn) {
		btn.hasAttribute('formaction') && (action = btn.formAction);
		btn.hasAttribute('formmethod') && (method = btn.formMethod);
		btn.hasAttribute('formtarget') && (target = btn.formTarget);
	}

	if (method && method.toLowerCase() !== 'get') return;
	if (target && target.toLowerCase() !== '_self') return;

	const { pathname, hash } = new URL(action),
		search = [],
		state = {};

	const elements = form.elements,
		len = elements.length;

	for (let i = 0; i < len; i++) {
		if (!elements[i].name || elements[i].disabled) continue;
		if (['checkbox', 'radio'].includes(elements[i].type) && !elements[i].checked) {
			continue;
		}
		if (isButton(elements[i]) && elements[i] !== btn) {
			continue;
		}
		if (elements[i].type === 'hidden') {
			state[elements[i].name] = elements[i].value;
			continue;
		}
		search.push(elements[i].name + '=' + elements[i].value);
	}

	let url = (pathname + '?' + search.join('&') + hash);
	url = url[0] !== '/' ? '/' + url : url;

	// strip leading "/[drive letter]:" on NW.js on Windows
	if (hasProcess && url.match(/^\/[a-zA-Z]:\//)) {
		url = url.replace(/^\/[a-zA-Z]:\//, '/');
	}

	e.preventDefault();
	goto(url, state);
}

function isButton(el) {
	const tagName = el.tagName.toLocaleLowerCase(),
		type = el.type && el.type.toLocaleLowerCase();
	return (tagName === 'button' || (tagName === 'input' &&
		['button', 'submit', 'image'].includes(type)));
}

export { back, click, fragment, goto, path, query, state, submit, url };
