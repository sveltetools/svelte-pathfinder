# Tiny, state-based, advanced router for SvelteJS.

[![NPM version](https://img.shields.io/npm/v/svelte-pathfinder.svg?style=flat)](https://www.npmjs.com/package/svelte-pathfinder) [![NPM downloads](https://img.shields.io/npm/dm/svelte-pathfinder.svg?style=flat)](https://www.npmjs.com/package/svelte-pathfinder)

A completely different approach of routing. State-based router suggests that routing is just another global state and History API changes are just an optional side-effects of this state.

## 💡 Features

- Zero-config! 
- Just another global state. Ultimate freedom how to apply this state to your app! 
- Juggling of different parts of URL (path/query/hash) effective and granularly. 
- Automatic parsing of the `query` params, optional parsing `path` params.
- Helpers to work with navigation, links, and even html forms.

![preview](https://user-images.githubusercontent.com/4378873/220714832-e1aefab3-7cfa-4f4a-9a02-3e280257388c.png)

## 📦 Install

```bash
npm i svelte-pathfinder --save-dev
```

```bash
yarn add svelte-pathfinder
```

CDN: [UNPKG](https://unpkg.com/svelte-pathfinder/) | [jsDelivr](https://cdn.jsdelivr.net/npm/svelte-pathfinder/) (available as `window.Pathfinder`)

```html
<script src="https://unpkg.com/svelte-pathfinder/dist/pathfinder.min.js"></script>

<!-- OR in modern browsers -->

<script type="module" src="https://unpkg.com/svelte-pathfinder/dist/pathfinder.min.mjs"></script>
```

## 📌 URL schema

`/path`?`query`#`fragment`

## 🤖 API

### Stores

`path` - represents path segments of the URL as an array.

```javascript
path: Writable<[]>
```

`query` - represents query params of the URL as an object.

```javascript
query: Writable<{}>
```

`fragment` - represents fragment (hash) string of URL.

```javascript
fragment: Writable<string>
```

`state` - represents state object associated with the new history entry created by pushState().

```javascript
state: Writable<{}>
```

`url` - represents full URL string.

```javascript
url: Readable<string>
```

`pattern` - function to match path patterns and return read-only `params` object or `null`.

```javascript
pattern: Readable<<T extends {}>(pattern?: string | RegExp, options?: ParseParamsOptions) => T | null>
```

`paramable` - constructor of custom `params` stores to parse path patterns and manipulate path parameters.

```javascript
paramable: <T extends {}>(pattern?: string, options?: ParseParamsOptions): Writable<T>;
```

### Helpers

`goto` - perform navigation to the next router state by URL.

```javascript
goto(url: string | URL, state?: {});
```

`back` - perform navigation to the previous router state.

```javascript
back(url?: string | URL)
```

`redirect` - update current url without new history record.

```javascript
redirect(url: string | URL, state?: {})
```

`click` - handle click event from the link and perform navigation to its targets.

```javascript
click(event: MouseEvent)
```

`submit` - handle submit event from the GET-form and perform navigation using its inputs.

```javascript
submit(event: SubmitEvent)
```

### Configuration

- `prefs` - preferences object
    - `sideEffect` - manually disable/enable History API usage (changing URL) (default: auto).
    - `hashbang` - manually activate hashbang-routing.
    - `base` - set base path if web app is located within a nested basepath.
    - `convertTypes` - disable converting types when parsing query/path parameters (default: true).
    - `nesting` - number of levels when pasring nested objects in query parameters (default: 3).
    - `array.format` - format for arrays in query parameters (possible values: 'bracket' (default), 'separator').
    - `array.separator` - if format is `separator` this field give you speficy which separator you want to use (default: ',').
    - `breakHooks` - whether or not hooks execution should be stopped immediately after first fail or all hooks should be performed in any case (default: true).
    - `anchor` - whether or not router should respect fragment (hash) value as an anchor if DOM element with appropriate id attribute is found (default: false).
    - `scroll` - whether or not router should restore scroll position upon the navigation (default: false).
    - `focus` - whether or not router should restore last focus on DOM element upon the navigation (default: false).

To change the preferences, just import and change them somewhere on top of your code:

```javascript
import { prefs } from 'svelte-pathfinder';

prefs.scroll = true;
prefs.convertTypes = false;
prefs.array.format = 'separator';
```

#### ParseParamsOptions

Usually, you don't need to use second argument in `$pattern()` function and `paramable` store constructor, but in some cases its options can be useful for your goals:

- `loose` - should the pattern match paths that are longer than the pattern itself? (default: false)
- `blank` - should blank params object (with undeifned values) returned if pattern not match? (default: false)
- `sensitive` - should be pattern case sensitive? (default: false)
- `decode` - you can provide you own function to decode URL parameters. (default: decodeURIComponent will be used)

## 🕹 Usage

### Changing markup related to the router state

```svelte
{#if params = $pattern('/products/:id')} <!-- eg. /products/1 -->
    <ProductView productId={params.id} />
{:else if params = $pattern('/products')} <!-- eg. /products?page=2&q=Apple -->
    <ProductsList page={$query.page} search={$query.q} />
{:else}
    <NotFound path={$path} />
{/if}

<Modal open={$fragment === '#login'}>
    <LoginForm />
</Modal>

<script>
    import { path, query, fragment, pattern } from 'svelte-pathfinder';
    let params;
</script>
```

#### Changing logic related to the router state

```svelte
{#if page}
    <svelte:component this={page.component} {params} />
{/if}

<script>
    ...
    import { path, pattern } from 'svelte-pathfinder';
    import routes from './routes.js'; // [{ pattern: '/products', component: ProductsList }, ...]
    ...
    let params;
    $: page = routes.find((route) => params = $pattern(route.pattern)) || null; // match path pattens and get parsed params
    ...
    $: if ($path[0] === 'admin' && ! isAuthorized) { // check any specific segment of the path
        $path = '/forbidden'; // re-write whole path
    }
</script>
```

Also, you able to use custom RegExp pattern instead of regular path-to-regexp pattern in `$pattern()` function. In this case, if you want to interprent some part of this RegExp pattern as an path parameter you need to use RegExp's [named groups](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Groups_and_Backreferences#using_named_groups). For example, you need to make sure that path includes numeric identifier in second segment of the path:

```svelte
{#if params = $pattern(/^\/todos\/(?<id>\d+)/)} <!-- will be matched only if second segment is a number -->
    <TodoDetail id={params.id} />
{:else if params = $pattern('/todos/:action')} <!-- will be matched if second segment is NOT a number but any other value -->
    <TodoAction action={params.action} />
{:else if $pattern('/todos')}
    <TodoList  />
{/if}

<script>
    import { pattern } from 'svelte-pathfinder';
    let params;
</script>
```

> ⚠️ Note: `paramable` stores still not support custom RegExp patterns. If you'll try to pass RegExp to `paramable` constructor it'll cause exception. Maybe similar support will be added in the future.

### Performing updates of router state with optional side-effect to URL

```svelte
<script>
    ...
    $query.page = 10; // set ?page=10 without changing or loose other query params
    ...
    $path[1] = 4; // set second segment of the path, e.g. /products/4
    ...
    $fragment = 'login'; // set url hash to #login 
    ...
    $state = { restoreOnBack: 'something' }; // set history record related state object
</script>
```

#### Directly bind & assign values to stores

```svelte
<input bind:value={$query.q} placeholder="Search product...">
...
<button on:click={() => $fragment = 'login'}>Login</button>
...
<a href="/products/{product.id}" on:click|preventDefault={e => $path[1] = product.id}>
    {product.title}
</a>
```

### Creating stores to manipulating path parameters

```javascript
// ./stores/params.js

import { paramable } from 'svelte-pathfinder';

export const productPageParams = paramable('/products/:category/:productId?');
...
```

```svelte
<select bind:value={$params.category}>
    <option value="all">All</option>
    {#each categories as category}
        <option value={category.slug}>{category.name}</option>
    {/each}
</select>
...
{#each products as product} 
    <a href="/products/{product.id}" on:click|preventDefault={e => $params.productId = product.id}>
        {product.title}
    </a>
{/each}

<script>
    import { productPageParams as params } from './store/params';
</script>
```

### Use with the other stores

```javascript
import { derived } from 'svelte/store';
import asyncable from 'svelte-asyncable';
import { path, query } from 'svelte-pathfinder';

 import { productPageParams } from './store/params';

// with regular derived store

export const productData = derived(productPageParams, ($params, set) => {
    if ($params.productId}) {
        fetch(`/api/products/${$params.productId}`)
            .then(res => res.json())
            .then(set);
    }
}, {});

// with svelte-asyncable

export const productsList = asyncable(async $query => {
    const res = await fetch(`/api/products${$query}`)
    return res.json();
}, undefined, [ query ]);

```

### Using helper `click`

Auto-handling all links in the application.

```svelte
<svelte:window on:click={click} />

<!-- links below will be handled by `click` helper -->

<nav class="navigate">
    <a href="/">Home</a>
    <a href="/products">Products</a>
    <a href="/about">About</a>
</nav>

<!-- links below will be EXCLUDED from the navigation -->

<nav class="not-navigate">
    <a href="http://google.com">External links</a>
    <a href="/shortlink/2hkjhrfwgsd" rel="external">Links with external rel</a>
    <a href="/products" target="_blank">Any links with target</a>
    <a href="/" target="_self">Any links with target even to _self</a>
    <a href="/path/prices.zip" download>Download links</a>  
    <a href="mailto:mail@example.com">Mailto links</a>
    <a href="tel:+432423535">Tel links</a>
    <a href="/cart" on:click|preventDefault|stopPropagation={doSomething}>
        Just stop click event bubbling
    </a>
    <a href="javascript:void(0)">Old style JS links</a>
    <a href="#hashOnly">Hash-only links</a>
</nav>

<script>
    import { click } from 'svelte-pathfinder';
</script>
```

### Using helpers `goto` and `back`

```svelte
<button on:click={() => back()}>Back</button> 
<button on:click={() => goto('/cart?tab=overview')}>Open cart</button>

<script>
    import { goto, back } from 'svelte-pathfinder';
</script>
```

### Using helper `submit`

```svelte
<!-- handle GET-forms -->
<form on:submit={submit} action="/products" method="GET">
    <!-- all hidden fields will be propagated to $state by name attributes -->

    <input type="hidden" name="uid" value={$state.uid}>

    <!-- all visible fields will be propagated to $query by name attributes -->

    <input name="q" value={$query.q} placeholder="Title...">

    <select name="option" value={$query.option}>
        <option>1</option>
        <option>2</option>
        <option>3</option>
    </select>

    <!-- even pushed submit button will be propagated to $query by name attribute -->

    <button name="type" value="quick">Quick search</button>
    <button name="type" value="fulltext">Fulltext search</button>
</form>

<script>
    import { submit, query, state } from 'svelte-pathfinder';
</script>
```

### Using hooks

Hook is a callback function which will be executed before actual router state update to perform some side-effects. Callback function receives 3 arguments: (1) upcoming store value, (2) current store value and (3) name of the store (simple 'path', 'query' or 'fragment' string).

If callback function return explicit `false`, specific router state update and subsequent navigation will be skipped. It can be useful for some kind of guards for specific router states.

Hooks applicable only for major stores such as path, query or fragment. Hook can be added using `hook` method of particular store which is returns `cancel` function:

```javascript
onDestroy(path.hook(($path, $currentPath, name) => {

    if ($path[0] === 'my' && ! isAuthorized()) return false; // skip router state update

    // do some additional side-effect

    console.log(`Hook of ${name} performed`); // output: Hook of path performed
}));
```

> ⚠️ Note: hooks are not pre-defined thing that's why it matters when and in what order the hooks are created in your app. When the hook is just added, the callback function will be executed instantly with upcoming value (first argument) equals `null` which means not actual state update, but that the hook was just cocked. You able to use this fact in some way:

```javascript
onDestroy(query.hook(($query, $currentQuery, name) => {
    if ($query === null) {
        console.log(`Hook for ${name} is just added`);
    }   
}));
```

Multiple hooks can be added to each particular store and they will be executed in order of adding hooks to the store. By default, if some hook returns explicit false value, execution process will be stoped immediately which is more optimized. If you need to perform all hooks in any case, just use `prefs.breakHooks = false`. In this case, all hooks will be executed but state still won't be updated and navigation won't be performed.

## 🔖 SSR support (highly experimental)

```javascript
require('svelte/register');

const express = require('express');

const app = express();
...
/* any other routes */
...
app.get('*', (req, res) => {
    const router = require('svelte-pathfinder/ssr')();
    const App = require('./App.svelte').default;

    router.goto(req.url);

    const { html, head, css } = App.render({ router });

    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                ${head}
                ${css}
            </head>
            <body>
                ${html}
            </body>
        </html>
    `);
});
```

> ⚠️ Note: you can't use `pathfinder` stores by just directly import it in SSR rendered applications (just like the other Svelte stores), because, in-fact, they're global to the entire server instance. To avoid it, just pass `pathfinder` instance to root component via props and use it in all components of application. For example using context:

```svelte
<!-- App.svelte -->
<svelte:window on:click={router.click}/>
<script>
    import { setContext } from 'svelte';

    export let router;
    setContext('router', router);
</script>
```

```svelte
<!-- Nested.svelte -->
<script>
    import { getContext } from 'svelte';

    const { path } = getContext('router');

    function gotoSomething() {
        $path = '/something';
    }
</script>
```

## 🚩 Assumptions

### Optional side-effect (changing browser history and URL)

Router will automatically perform `pushState` to browser History API and listening `popstate` event if the following conditions are valid:

* router works in browser and global objects are available (window & history).
* router works in browser which is support `pushState/popstate`.
* router works in top-level window and has no parent window (eg. iframe, frame, object, window.open).

If any condition is not applicable, the router will work properly but without side-effect (changing URL).

### `hashbang` routing (`#!`)

Router will automatically switch to `hashbang` routing in the following conditions:

* `History API` is not available.
* web app has launched under `file:` protocol.
* initial path contain exact file name with extension.

## © License

MIT &copy; [PaulMaly](https://github.com/PaulMaly)
