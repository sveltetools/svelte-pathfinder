# Tiny, state-based, advanced router for SvelteJS.

[![NPM version](https://img.shields.io/npm/v/svelte-pathfinder.svg?style=flat)](https://www.npmjs.com/package/svelte-pathfinder) [![NPM downloads](https://img.shields.io/npm/dm/svelte-pathfinder.svg?style=flat)](https://www.npmjs.com/package/svelte-pathfinder)

A completely different approach of routing. State-based router suggests that routing is just another global state and History API changes are just an optional side-effects of this state.

## Features

- Zero-config.
- Just another global state.
- It doesn't impose any restrictions on how to apply this state to the application.
- Manipulate different parts of a state (path/query/hash) separately.
- Automatic parsing of the `query` params, optional parsing `path` params.
- Helpers to work with navigation, links, and even forms.

## Install

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

## URL schema to state

**/path**?*query*`#fragment`

## API

### Stores

- `path` - represents path segments of the URL as an object.
- `query` - represents query params of the URL as an object.
- `fragment` - represents fragment (hash) string of URL.
- `state` - represents state object associated with the new history entry created by pushState().
- `url` - represents full URL string.
- `pattern` - function to match path patterns to `path.params` and return boolean result.

### Helpers

- `goto` - perform navigation to the next router state by URL.

```javascript
goto(url: String, state?: Object)
```

- `back` - perform navigation to the previous router state.

```javascript
back(path?: String)
```

- `click` - handle click event from the link and perform navigation to its targets.

```javascript
click(event: MouseEvent)
```

- `submit` - handle submit event from the GET-form and perform navigation using its inputs.

```javascript
submit(event: SubmitEvent)
```

### Configuration

- `prefs` - preferences object
    - `sideEffect` - manually disable/enable History API usage (changing URL) (default: auto).
    - `hashbang` - manually activate hashbang-routing.
    - `basePath` - set base path if web app is located within a nested basepath.
    - `convertTypes` - disable converting types when parsing query/path parameters (default: true).
    - `nesting` - number of levels when pasring nested objects in query parameters (default: 3).
    - `array.format` - format for arrays in query parameters (possible values: 'bracket' (default), 'separator').
    - `array.separator` - if format is `separator` this field give you speficy which separator you want to use (default: ',').

To change the preferences, just import and change them somewhere on top of your code:

```javascript
import { prefs } from 'svelte-pathfinder';

prefs.convertTypes = false;
prefs.array.format = 'separator';
```

## Usage

#### Changing markup related to the router state

```svelte
{#if $pattern('/products/:id')} <!-- eg. /products/1 -->
    <ProductView productId={$path.params.id} />
{:else if $pattern('/products')} <!-- eg. /products?page=2&q=Apple -->
    <ProductsList page={$query.params.page} search={$query.params.q} />
{:else}
    <NotFound path={$path.toString()} />
{/if}

<Modal open={$fragment === '#login'}>
    <LoginForm />
</Modal>

<script>
    import { path, query, fragment, pattern } from 'svelte-pathfinder';
</script>
```

#### Changing logic related to the router state

```svelte
<svelte:component this={page} />

<script>
    ...
    import { path, pattern } from 'svelte-pathfinder';
    import routes from './routes.js';
    ...
    $: page = routes.find((route) => $pattern(route.match)) || null;
    ...
    $: if ($path.toString() === '/admin' && ! isAuthorized) {
        $path = '/forbidden';
    }
</script>
```

#### User input

```svelte
<input bind:value={$query.params.q} type="search" placeholder="Find...">

<script>
    import { query } from 'svelte-pathfinder';
</script>
```

#### Use with the other stores

```javascript
import { derived } from 'svelte/store';
import asyncable from 'svelte-asyncable';
import { path, query } from 'svelte-pathfinder';

// with regular derived store
export const productData = derived(path, ($path, set) => {
    if ($path.search('/products/')) {
        fetch(`/api/products/${$path.params.id}`)
            .then(res => res.json())
            .then(set);
    }
}, {});

// with svelte-asyncable
export const productsList = asyncable(async $query => {
    const res = await fetch(`/api/products${$query.toString()}`)
    return res.json();
}, undefined, [ query ]);

```

#### Directly bind & assign values to stores

```svelte
<input bind:value={$query.params.q} placeholder="Search product...">

<button on:click={() => $fragment = '#login'}>Login</button>

<a href="/products/10" on:click={e => $path = '/products/10'}>
    Product 10
</a>
```

### Using helper `click`

Auto-handling all links in the application.

```svelte
<svelte:window on:click={click} />

<nav class="navigate">
    <a href="/">Home</a>
    <a href="/products">Products</a>
    <a href="/about">About</a>
</nav>

<!-- links below will be excluded from the navigation -->
<nav class="not-navigate">
    <a href="http://google.com">External link</a>
    <a href="/products" target="_blank">Open in new window</a>
    <a href="/path/prices.zip" download>Download pricing table</a>
    <a href="/" target="_self">Navigate with full page reload</a>
    <a href="/cart" on:click|preventDefault|stopPropagation={doSomething}>
        Just stop click event bubbling
    </a>
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

    <input name="q" value={$query.params.q} placeholder="Title...">

    <select name="option" value={$query.params.option}>
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

## Optional side-effect (changing browser history and URL)

Router will automatically perform `pushState` to browser History API and listening `popstate` event if the following conditions are valid:

* router works in browser and global objects are available (window & history).
* router works in browser which is support `pushState/popstate`.
* router works in top-level window and has no parent window (eg. iframe, frame, object, window.open).

If any condition is not applicable, the router will work properly but without side-effect (changing URL).

## `hashbang` routing (`#!`)

Router will automatically switch to `hashbang` routing in the following conditions:

* `History API` is not available.
* web app has launched under `file:` protocol.
* initial path contain exact file name with extension.

## License

MIT &copy; [PaulMaly](https://github.com/PaulMaly)
