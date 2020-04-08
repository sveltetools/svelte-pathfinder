# State-based router for Svelte 3.

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

If you are **not** using using es6 or CDN, instead of this add 

```html
<script src="/path/to/svelte-pathfinder/index.js"></script>
```

just before closing body tag.


## URL schema to state

**/path**?*query*`#framgent`

## API

### Stores

- `path` - represents path segments of the URL as an object.
- `query` - represents query params of the URL as an object.
- `fragment` - represents fragment (hash) string of URL.
- `state` - represents state object associated with the new history entry created by pushState().
- `url` - represents full URL string.

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

## Usage

#### Changing markup related to the router state

```svelte
{#if $path.pattern('/products/:id')} <!-- eg. /products/1 -->
    <ProductView productId={$path.id} />
{:else if $path.pattern('/products')} <!-- eg. /products?page=2&q=Apple -->
    <ProductsList page={$query.page} search={$query.q} />
{:else}
    <NotFound path={$path.toString()} />
{/if}

<Modal open={$fragment === '#login'}>
    <LoginForm />
</Modal>

<script>
    ...
    import { path, query, fragment } from 'svelte-pathfinder';
</script>
```

#### Changing logic related to the router state

```svelte
<svelte:component this={Component} />

<script>
    ...
    import { path } from 'svelte-pathfinder';
    ...
    $: Component = routes[$path];
    $: if ($path.toString() === '/admin' && ! isAuthorized) {
        $path = '/forbidden';
    }
</script>
```

#### Use with the other stores

```javascript
import { derived } from 'svelte/store';
import asyncable from 'svelte-asyncable';
import { path, query } from 'svelte-pathfinder';

// with regular derived store
export const productData = derived(path, ($path, set) => {
    if ($path.pattern('/products/:id')) {
        fetch(`/api/products/${$path.id}`)
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
<input bind:value={$query.q} placeholder="Search product...">

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

## Optional side-effect (changing browser history and URL)

Router will automatically perform `pushState` to browser History API and listening `popstate` event if the following conditions are valid:

* router works in browser and global objects are available (window & history).
* router works in top-level window and has no parent window (eg. iframe, frame, object, window.open).

If any condition is not applicable, the router will work properly but without side-effect.

## License

MIT &copy; [PaulMaly](https://github.com/PaulMaly)
