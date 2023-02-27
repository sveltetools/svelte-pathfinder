import { tick } from 'svelte';
import { derived, writable } from 'svelte/store';

import {
	prependPrefix,
	specialLinks,
	hasPushState,
	useHashbang,
	parseParams,
	getLocation,
	listenEvent,
	hasProcess,
	sideEffect,
	getShortURL,
	getFullURL,
	isButton,
	getPath,
	closest,
	prefs,
} from './utils';

import { pathable, queryable, fragmentable, createParamStore } from './stores';

const pathname = getPath();
const { search, hash } = getLocation();

let popstate = true;
let replace = false;
let len = 0;

const path = pathable(pathname);

const query = queryable(search);

const fragment = fragmentable(hash);

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

if (sideEffect) {
	const cleanup = new Set();

	cleanup.add(
		url.subscribe(($url) => {
			if (!prefs.sideEffect) return;
			if (popstate) return (popstate = false);
			if (hasPushState) {
				history[replace ? 'replaceState' : 'pushState']({}, null, getFullURL($url));
			} else {
				location.hash = getFullURL($url);
			}
			!replace && len++;
			replace = false;
		})
	);

	if (hasPushState) {
		cleanup.add(
			state.subscribe(($state) => {
				if (!prefs.sideEffect) return;
				history.replaceState(
					$state,
					null,
					location.pathname + location.search + location.hash
				);
			})
		);

		cleanup.add(
			listenEvent('popstate', (e) => {
				if (!prefs.sideEffect) return;
				popstate = true;
				goto(location.href, e.state);
			})
		);
	} else {
		cleanup.add(
			listenEvent('hashchange', () => {
				if (!prefs.sideEffect) return;
				prefs.hashbang || useHashbang ? goto(location.hash) : fragment.set(location.hash);
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
	if (len >= 0 && sideEffect && prefs.sideEffect) {
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

	if (
		!a ||
		a.target ||
		a.hasAttribute('download') ||
		(a.hasAttribute('rel') && a.getAttribute('rel').includes('external'))
	)
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
