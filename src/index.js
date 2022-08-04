import { tick } from 'svelte';
import { derived, writable } from 'svelte/store';

import {
	prependSlash,
	matchPattern,
	specialLinks,
	useHashbang,
	getLocation,
	hasProcess,
	sideEffect,
	getShortURL,
	getFullURL,
	isButton,
	getPath,
	closest,
	prefs,
} from './shared';

import { pathStore, queryStore } from './stores';

const pathname = getPath();
const search = getLocation().search;
const hash = getLocation().hash;

let popstate = true;
let replace = false;
let len = 0;

const path = pathStore(pathname);

const query = queryStore(search);

const fragment = writable(hash, (set) => {
	const handler = () =>
		prefs.hashbang || useHashbang ? goto(location.hash) : set(location.hash);
	sideEffect && prefs.sideEffect && window.addEventListener('hashchange', handler);
	return () =>
		sideEffect && prefs.sideEffect && window.removeEventListener('hashchange', handler);
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

		return () => (skip = true);
	},
	pathname + search + hash
);

const pattern = derived(path, ($path) => (match = '*', loose) => {
	const params = matchPattern($path.toString(), match, loose);
	params && Object.assign($path, { params });
	return !!params;
});

if (sideEffect) {
	url.subscribe(($url) => {
		if (!prefs.sideEffect) return;
		if (popstate) return (popstate = false);
		history[replace ? 'replaceState' : 'pushState']({}, null, getFullURL($url));
		!replace && len++;
		replace = false;
	});

	state.subscribe(($state) => {
		if (!prefs.sideEffect) return;
		history.replaceState($state, null, location.pathname + location.search + location.hash);
	});

	window.addEventListener('popstate', (e) => {
		if (!prefs.sideEffect) return;
		popstate = true;
		goto(location.href, e.state);
	});
}

function goto(url = '', data) {
	const { pathname, search, hash } = new URL(getShortURL(url), 'file:');

	path.set(pathname);

	tick().then(() => {
		query.set(search);
		fragment.set(hash);
		data && state.set(data);
	});
}

function back(pathname = '/') {
	if (len > 0 && sideEffect && prefs.sideEffect) {
		history.back();
		len--;
	} else {
		tick().then(() => path.set(pathname));
	}
}

function redirect(url, data) {
	tick().then(() => {
		replace = true;
		goto(url, data);
	});
}

function click(e) {
	if (
		!e.target ||
		e.ctrlKey ||
		e.metaKey ||
		e.altKey ||
		e.shiftKey ||
		e.button ||
		e.which !== 1 ||
		e.defaultPrevented
	)
		return;

	const a = closest(e.target, 'a');

	if (!a || a.target || a.hasAttribute('download') || a.getAttribute('rel') === 'external')
		return;

	const url = a.getAttribute('href');
	if (!url || a.href.indexOf(location.origin) !== 0 || specialLinks.test(url)) return;

	e.preventDefault();
	goto(url, Object.assign({}, a.dataset));
}

function submit(e) {
	if (!e.target || e.defaultPrevented) return;

	const form = e.target;
	const btn = e.submitter || (isButton(document.activeElement) && document.activeElement);

	let action = form.action;
	let method = form.method;
	let target = form.target;

	if (btn) {
		btn.hasAttribute('formaction') && (action = btn.formAction);
		btn.hasAttribute('formmethod') && (method = btn.formMethod);
		btn.hasAttribute('formtarget') && (target = btn.formTarget);
	}

	if (method && method.toLowerCase() !== 'get') return;
	if (target && target.toLowerCase() !== '_self') return;

	const { pathname, hash } = new URL(action);
	const search = [];
	const state = {};

	const elements = form.elements;
	const len = elements.length;

	for (let i = 0; i < len; i++) {
		const element = elements[i];
		if (!element.name || element.disabled) continue;
		if (['checkbox', 'radio'].includes(element.type) && !element.checked) {
			continue;
		}
		if (isButton(element) && element !== btn) {
			continue;
		}
		if (element.type === 'hidden') {
			state[element.name] = element.value;
			continue;
		}
		search.push(element.name + '=' + element.value);
	}

	let url = prependSlash(pathname + '?' + search.join('&') + hash);

	if (hasProcess && url.match(/^\/[a-zA-Z]:\//)) {
		url = url.replace(/^\/[a-zA-Z]:\//, '/');
	}

	e.preventDefault();
	goto(url, state);
}

export { redirect, fragment, pattern, submit, click, prefs, state, query, path, back, goto, url };
