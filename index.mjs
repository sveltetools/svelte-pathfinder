import { tick } from 'svelte';
import { writable, derived } from 'svelte/store';

function pattern(route = '') {
    const { pattern, keys } = parseParams(route);
    const pathname = this.toString(), matches = pattern.exec(pathname);
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
function parseQuery(str = '', params) {
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
            }
            else {
                obj[key] = convertType(o[key], params);
            }
            return obj;
        }, obj);
        return obj;
    }, {}) : {};
}
function stringifyQuery(obj = {}, params) {
    const qs = Object.keys(obj)
        .reduce((a, k) => {
        if (obj.hasOwnProperty(k) && isNaN(parseInt(k, 10))) {
            if (Array.isArray(obj[k])) {
                if (params.array.format === 'separator') {
                    a.push(k + '=' + obj[k].join(params.array.separator));
                }
                else {
                    obj[k].forEach(v => a.push(k + '[]=' + encodeURIComponent(v)));
                }
            }
            else if (typeof obj[k] === 'object' && obj[k] !== null) {
                let o = parseKeys(k, obj[k], params);
                a.push(stringifyObject(o));
            }
            else {
                a.push(k + '=' + encodeURIComponent(obj[k]));
            }
        }
        return a;
    }, [])
        .join('&');
    return qs ? `?${qs}` : '';
}
function parseParams(str, loose = false) {
    let arr = str.split('/'), keys = [], pattern = '', c, o, tmp, ext;
    arr[0] || arr.shift();
    while (tmp = arr.shift()) {
        c = tmp[0];
        if (c === '*') {
            keys.push('wild');
            pattern += '/(.*)';
        }
        else if (c === ':') {
            o = tmp.indexOf('?', 1);
            ext = tmp.indexOf('.', 1);
            keys.push(tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length));
            pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
            if (!!~ext)
                pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
        }
        else {
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
    }
    else if (typeof val === 'object') {
        return Object.entries(val).reduce((obj, [k, v]) => {
            obj[k] = convertType(v, params);
            return obj;
        }, {});
    }
    if (val === 'true' || val === 'false') {
        return val === 'true';
    }
    else if (val === 'null') {
        return null;
    }
    else if (val === 'undefined') {
        return undefined;
    }
    else if (val !== '' && !isNaN(Number(val))) {
        return Number(val);
    }
    else if (params.array.format === 'separator' && typeof val === 'string') {
        const arr = val.split(params.array.separator);
        return arr.length > 1 ? arr : val;
    }
    return val;
}
function parseKeys(key, val, params) {
    const brackets = /(\[[^[\]]*])/, child = /(\[[^[\]]*])/g;
    let seg = brackets.exec(key), parent = seg ? key.slice(0, seg.index) : key, keys = [];
    parent && keys.push(parent);
    let i = 0;
    while ((seg = child.exec(key)) && i < params.nesting) {
        i++;
        keys.push(seg[1]);
    }
    seg && keys.push('[' + key.slice(seg.index) + ']');
    return parseObject(keys, val, params);
}
function parseObject(chain, val, params) {
    let leaf = val;
    for (let i = chain.length - 1; i >= 0; --i) {
        let root = chain[i], obj;
        if (root === '[]') {
            obj = [].concat(leaf);
        }
        else {
            obj = {};
            const key = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root, j = parseInt(key, 10);
            if (!isNaN(j) && root !== key && String(j) === key && j >= 0) {
                obj = [];
                obj[j] = convertType(leaf, params);
            }
            else {
                obj[key] = leaf;
            }
        }
        leaf = obj;
    }
    return leaf;
}
function stringifyObject(obj = {}, nesting = '') {
    return Object.entries(obj).map(([key, val]) => {
        if (typeof val === 'object') {
            return stringifyObject(val, nesting ? nesting + `[${key}]` : key);
        }
        else {
            return [nesting + `[${key}]`, val].join('=');
        }
    }).join('&');
}

const hasWindow = typeof window !== 'undefined', hasHistory = typeof history !== 'undefined', hasLocation = typeof location !== 'undefined', subWindow = hasWindow && window !== window.parent, sideEffect = hasWindow && hasHistory && !subWindow;
const pathname = hasLocation ? location.pathname : '', search = hasLocation ? location.search : '', hash = hasLocation ? location.hash : '';
let popstate = false;
const prefs = {
    query: {
        array: {
            separator: ',',
            format: 'bracket'
        },
        nesting: 3
    },
    sideEffect
};
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
const url = derived([path, query, fragment], ([$path, $query, $fragment], set) => {
    let skip = false;
    tick().then(() => {
        if (skip)
            return;
        set($path.toString() + $query.toString() + $fragment.toString());
    });
    return () => skip = true;
}, pathname + search + hash);
if (sideEffect) {
    url.subscribe($url => {
        if (!prefs.sideEffect)
            return;
        if (popstate)
            return popstate = false;
        history.pushState({}, null, $url);
    });
    state.subscribe($state => {
        if (!prefs.sideEffect)
            return;
        const url = location.pathname + location.search + location.hash;
        history.replaceState($state, null, url);
    });
    window.addEventListener('popstate', e => {
        if (!prefs.sideEffect)
            return;
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

const pathStore = createStore(path => {
    if (!(path instanceof String))
        path = new String(path);
    return Object.assign(path, { pattern });
});
const queryStore = createStore(query => {
    if (typeof query !== 'string')
        query = stringifyQuery(query, prefs.query);
    return Object.assign(new String(query), parseQuery(query, prefs.query));
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
const hasWindow$1 = typeof window !== 'undefined', hasHistory$1 = typeof history !== 'undefined', hasLocation$1 = typeof location !== 'undefined', hasProcess = typeof process !== 'undefined', subWindow$1 = hasWindow$1 && window !== window.parent, sideEffect$1 = hasWindow$1 && hasHistory$1 && !subWindow$1;
const pathname$1 = hasLocation$1 ? location.pathname : '', search$1 = hasLocation$1 ? location.search : '', hash$1 = hasLocation$1 ? location.hash : '';
let popstate$1 = false, len = 0;
const prefs$1 = {
    query: {
        array: {
            separator: ',',
            format: 'bracket'
        },
        nesting: 3
    },
    sideEffect: sideEffect$1
};
const path$1 = pathStore(pathname$1);
const query$1 = queryStore(search$1);
const fragment$1 = writable(hash$1, set => {
    const handler = () => set(location.hash);
    sideEffect$1 && prefs$1.sideEffect && window.addEventListener('hashchange', handler);
    return () => {
        sideEffect$1 && prefs$1.sideEffect && window.removeEventListener('hashchange', handler);
    };
});
const state$1 = writable({});
const url$1 = derived([path$1, query$1, fragment$1], ([$path, $query, $fragment], set) => {
    let skip = false;
    tick().then(() => {
        if (skip)
            return;
        set($path.toString() + $query.toString() + $fragment.toString());
    });
    return () => skip = true;
}, pathname$1 + search$1 + hash$1);
if (sideEffect$1) {
    url$1.subscribe($url => {
        if (!prefs$1.sideEffect)
            return;
        if (popstate$1)
            return popstate$1 = false;
        history.pushState({}, null, $url);
        len++;
    });
    state$1.subscribe($state => {
        if (!prefs$1.sideEffect)
            return;
        const url = location.pathname + location.search + location.hash;
        history.replaceState($state, null, url);
    });
    window.addEventListener('popstate', e => {
        if (!prefs$1.sideEffect)
            return;
        popstate$1 = true;
        goto$1(location.href, e.state);
    });
}
function goto$1(url = '', data) {
    const { pathname, search, hash } = new URL(url, 'file:');
    path$1.set(pathname);
    query$1.set(search);
    fragment$1.set(hash);
    data && tick().then(() => state$1.set(data));
}
function back(pathname = '/') {
    if (len > 0 && sideEffect$1 && prefs$1.sideEffect) {
        history.back();
        len--;
    }
    else {
        tick().then(() => path$1.set(pathname));
    }
}
function click(e) {
    if (!e.target ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.shiftKey ||
        e.button ||
        e.which !== 1 ||
        e.defaultPrevented)
        return;
    const target = e.target;
    const a = target.closest('a');
    if (!a || a.target || a.hasAttribute('download'))
        return;
    const url = a.href;
    if (!url || url.indexOf(location.origin) !== 0 || specialLinks.test(url))
        return;
    e.preventDefault();
    goto$1(url, Object.assign({}, a.dataset));
}
function submit(e) {
    if (!e.target || e.defaultPrevented)
        return;
    const form = e.target, btn = (e.submitter || isButton(document.activeElement) && document.activeElement);
    let action = form.action, method = form.method, target = form.target;
    if (btn) {
        btn.hasAttribute('formaction') && (action = btn.formAction);
        btn.hasAttribute('formmethod') && (method = btn.formMethod);
        btn.hasAttribute('formtarget') && (target = btn.formTarget);
    }
    if (method && method.toLowerCase() !== 'get')
        return;
    if (target && target.toLowerCase() !== '_self')
        return;
    const { pathname, hash } = new URL(action), search = [], state = {};
    const elements = form.elements, len = elements.length;
    for (let i = 0; i < len; i++) {
        const element = elements[i];
        if (!element.name || element.disabled)
            continue;
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
    let url = (pathname + '?' + search.join('&') + hash);
    url = url[0] !== '/' ? '/' + url : url;
    if (hasProcess && url.match(/^\/[a-zA-Z]:\//)) {
        url = url.replace(/^\/[a-zA-Z]:\//, '/');
    }
    e.preventDefault();
    goto$1(url, state);
}
function isButton(el) {
    const tagName = el.tagName.toLocaleLowerCase(), type = el.type && el.type.toLocaleLowerCase();
    return (tagName === 'button' || (tagName === 'input' &&
        ['button', 'submit', 'image'].includes(type)));
}

export { back, click, fragment$1 as fragment, goto$1 as goto, path$1 as path, prefs$1 as prefs, query$1 as query, state$1 as state, submit, url$1 as url };
