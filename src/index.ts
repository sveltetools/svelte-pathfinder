import { tick } from 'svelte';
import { derived, writable } from 'svelte/store';
import {
	hasLocation,
	hasProcess,
	prefs,
	sideEffect,
	specialLinks,
} from './shared';

import { pathStore, queryStore } from './stores';

interface SubmitEvent extends Event {
	submitter: HTMLElement;
}

type HTMLFormControl = HTMLButtonElement & HTMLSelectElement & HTMLDataListElement & HTMLTextAreaElement & HTMLInputElement;

const pathname = hasLocation ? location.pathname : '',
	search = hasLocation ? location.search : '',
	hash = hasLocation ? location.hash : '';

let popstate = false,
	len = 0;

const path = pathStore(pathname);

const query = queryStore(search);

const fragment = writable(hash, set => {
	const handler = () => set(location.hash);
	sideEffect && prefs.sideEffect && window.addEventListener('hashchange', handler);
	return () => {
		sideEffect && prefs.sideEffect && window.removeEventListener('hashchange', handler);
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
		if (!prefs.sideEffect) return;
		if (popstate) return popstate = false;
		history.pushState({}, null, $url);
		len++;
	});

	state.subscribe($state => {
		if (!prefs.sideEffect) return;
		const url = location.pathname + location.search + location.hash;
		history.replaceState($state, null, url);
	});

	window.addEventListener('popstate', e => {
		if (!prefs.sideEffect) return;
		popstate = true;
		goto(location.href, e.state);
	});
}

function goto(url: string = '', data: {}) {

	const { pathname, search, hash } = new URL(url, 'file:');

	path.set(pathname);
	query.set(search);
	fragment.set(hash);

	data && tick().then(() => state.set(data));
}

function back(pathname: string = '/') {
	if (len > 0 && sideEffect && prefs.sideEffect) {
		history.back();
		len--;
	} else {
		tick().then(() => path.set(pathname));
	}
}

function click(e: MouseEvent) {
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

	const target = e.target as HTMLElement;
	const a: HTMLAnchorElement = target.closest('a');
	if (!a || a.target || a.hasAttribute('download')) return;

	const url = a.href;
	if (!url || url.indexOf(location.origin) !== 0 || specialLinks.test(url)) return;

	e.preventDefault();
	goto(url, Object.assign({}, a.dataset));
}

function submit(e: SubmitEvent) {
	if (!e.target || e.defaultPrevented) return;

	const form: HTMLFormElement = e.target as HTMLFormElement,
		btn: HTMLButtonElement = (e.submitter || isButton(document.activeElement) && document.activeElement) as HTMLButtonElement;

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

	const elements: HTMLFormControlsCollection = form.elements,
		len = elements.length;

	for (let i = 0; i < len; i++) {
		const element: HTMLFormControl = elements[i] as HTMLFormControl;
		if (!element.name || element.disabled) continue;
		if (['checkbox', 'radio'].includes(element.type) && !element.checked) {
			continue;
		}
		if (isButton(element) && element as HTMLButtonElement !== btn) {
			continue;
		}
		if (element.type === 'hidden') {
			state[element.name] = element.value;
			continue;
		}
		search.push(element.name + '=' + element.value);
	}

	let url: string = (pathname + '?' + search.join('&') + hash);
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

export {
	fragment,
	submit,
	click,
	prefs,
	state,
	query,
	path,
	back,
	goto,
	url,
};
