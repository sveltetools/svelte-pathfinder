import { tick } from 'svelte';
import { derived, writable } from 'svelte/store';

import { pathStore, queryStore } from './stores.js';

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

export const path = pathStore(pathname);

export const query = queryStore(search);

export const fragment = writable(hash, set => {
	const handler = () => set(location.hash);
	sideEffect && window.addEventListener('hashchange', handler);
	return () => {
		sideEffect && window.removeEventListener('hashchange', handler);
	};
});

export const state = writable({});

export const url = derived(
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

export function goto(url = '', data) {

	const { pathname, search, hash } = new URL(url, 'file:');

	path.set(pathname);
	query.set(search);
	fragment.set(hash);

	data && tick().then(() => state.set(data));
}

export function back(pathname = '/') {
	if (len > 0 && sideEffect) {
		history.back();
		len--;
	} else {
		tick().then(() => path.set(pathname));
	}
}

export function click(e = {}) {
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

export function submit(e = {}) {
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
