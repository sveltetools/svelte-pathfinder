# svelte-pathfinder changelog

# 3.2.2
* Fix types.

# 3.2.1
* Fix `click` helper issue.

# 3.2.0
* SVG support improved.
* rel=external support to prevent some link handling.
* `redirect()` function added. 

# 3.1.3
* Fix for duplicate records in browser history on each page load (#11).

# 3.1.2
* Fix absolute URLs in `goto`.
* Few improvements.

# 3.1.1
* Update README.
* Switch to `hashbang` routing automatically if initial path contain file name with extension.
* Switch to `hashbang` routing automatically if `History API` not available.

# 3.1.0
* Support of `hashbang` routing automatically for `file://` protocol and manually via `prefs`.
* Support of working in subdirectory using `basePath` preference in `prefs`.

# 3.0.6
* Improve typings.

# 3.0.5
* Fix typings

# 3.0.4
* Minor fix in `package.json`.

# 3.0.2
* Add special fields to `package.json` for CDNs.
* Add babel and prettier configs to `package.json`.

# 3.0.1

* Fix typings
* Fix README

# 3.0.0

* (breacking change): Now `pattern()` is not a part of `path` store, but separate derived store related to `path`. Please, check an examples in README.
* (breacking change): Now all parsed parameters of `path` and `query` stores collected in `params` property of that objects. Please, check an examples in README.
* Re-write back to plain Javascript, but with typings support.
* Fix for issue #10 in original repo.
* Official SSR support. Examples coming soon!


# 2.2.1

* Move build output to a dedicated dist folder

# 2.2.0

* Use single export instead of multiple.
* Fix `prefs` export which was missed in PR.

# 2.1.2

* Fix boolean values convertation.

# 2.1.1

* Minor fix of new query array param formating.

# 2.1.0

* Improve query string parsing
* Support different formats of query string array processing, eg. `?foo[]=1&foo[]=2` (default) and NEW alternative way `?foo=1,2`.
* Support arrays in `path` eg. param`/:variants` in example `/foo|bar|baz` will be parsed as array `$path.variants === ['foo', 'bar', 'baz']`.

# 2.0.0

* Re-write to Typescript (first edition).
* Add `svelte` to devDeps to get typings.
* Improve query string parsing, better support for nesting objects.
* Now configurable from user-land!
* Jest setup (tests coming soon).

# 1.1.0

* Fix URL() base.
* Fix deps.
* Code formatting via Prettier.

## 1.0.0

* First release
