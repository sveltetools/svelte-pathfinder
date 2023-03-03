import { tick } from 'svelte';
import { derived, writable } from 'svelte/store';

import {
	prependPrefix,
	specialLinks,
	hasPushState,
	useHashbang,
	parseParams,
	getLocation,
	isSubWindow,
	listenEvent,
	hasProcess,
	sideEffect,
	getShortURL,
	getFullURL,
	setScroll,
	setFocus,
	isButton,
	getPath,
	closest,
	prefs,
	isObj,
} from './utils';

import { pathable, queryable, fragmentable, createParamStore } from './stores';

const pathname = getPath();
const { search, hash } = getLocation();

let init = true;
let popstate = false;
let replace = false;
let len = 0;

const path = pathable(pathname, before);

const query = queryable(search, before);

const fragment = fragmentable(hash, before);

const state = writable({});

const url = derived(
	[path, query, fragment],
	([$path, $query, $fragment], set) => {
		let skip = false;
		tick().then(() => {
			if (skip) return;
			set(`${$path}${$query}${$fragment ? prependPrefix($fragment, '#') : ''}`);
		});

		return () => (skip = true);
	},
	pathname + search + hash
);

const pattern = derived(path, ($path) => parseParams.bind(null, $path.toString()));

function before() {
	if (!prefs.scroll && !prefs.focus) return;
	state.update(($state = {}) => {
		prefs.scroll &&
			($state._scroll = {
				top: window.pageYOffset,
				left: window.pageXOffset,
			});
		prefs.focus && ($state._focus = document.activeElement.id);
		return $state;
	});
}

function after(url, state) {
	const anchor = url.indexOf('#') >= 0 ? url.slice(url.indexOf('#')) : '';
	const activeElement = document.activeElement;
	!isObj(state) && (state = {});
	tick()
		.then(() => setFocus(state._focus, activeElement))
		.then(() => setScroll(state._scroll, anchor));
}

if (sideEffect || isSubWindow) {
	const cleanup = new Set();

	cleanup.add(
		url.subscribe(($url) => {
			if (!init && !popstate && prefs.sideEffect) {
				if (hasPushState) {
					history[replace ? 'replaceState' : 'pushState']({}, null, getFullURL($url));
				} else {
					location.hash = getFullURL($url);
				}
			}
			!popstate && after($url);
			!replace && len++;
			init = replace = popstate = false;
		})
	);

	if (hasPushState) {
		cleanup.add(
			state.subscribe(($state) => {
				if (init || !prefs.sideEffect) return;
				history.replaceState(
					$state,
					null,
					location.pathname + location.search + location.hash
				);
			})
		);
		cleanup.add(
			listenEvent('popstate', (e) => {
				popstate = true;
				goto(location.href, e.state);
				after(getShortURL(location.href), e.state);
			})
		);
	} else {
		cleanup.add(
			listenEvent('hashchange', () => {
				popstate = true;
				if (!prefs.hashbang && !useHashbang) return fragment.set(location.hash);
				goto(location.hash);
				after(getShortURL(location.hash));
			})
		);
	}
	cleanup.add(
		listenEvent(
			'unload',
			() => {
				cleanup.forEach((off) => off());
				cleanup.clear();
			},
			true
		)
	);
}

function goto(url = '', data = {}) {
	const { pathname, search, hash } =
		url instanceof URL ? url : new URL(getShortURL(url), 'file:');

	path.set(pathname);
	query.set(search);
	fragment.set(hash);

	tick().then(() => state.set(data || {}));
}

function back(url) {
	if (len > 0 && sideEffect && prefs.sideEffect) {
		history.back();
		len--;
	} else {
		tick().then(() => goto(url));
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

	if (
		!a ||
		a.target ||
		a.hasAttribute('download') ||
		(a.hasAttribute('rel') && a.getAttribute('rel').includes('external'))
	)
		return;

	if (!prefs.hashbang && !useHashbang && a.href.startsWith('#')) return;

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
		search.push(`${element.name}=${element.value}`);
	}

	let url = prependPrefix(`${pathname}?${search.join('&')}${hash}`);

	if (hasProcess && url.match(/^\/[a-zA-Z]:\//)) {
		url = url.replace(/^\/[a-zA-Z]:\//, '/');
	}

	e.preventDefault();
	goto(url, state);
}

export const paramable = createParamStore(path);

export { redirect, fragment, pattern, submit, click, prefs, state, query, path, back, goto, url };
