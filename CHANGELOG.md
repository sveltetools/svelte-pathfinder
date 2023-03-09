# svelte-pathfinder changelog

# 4.5.0
* (minor breaking change): `basePath` preference re-named to `base`.
* (minor breaking change): `query.toString()` now returns url-encoded string *NOT* prefixed by `?` symbol. 
* add support of full URL fallback in `back` helper instead of only `pathname`.
* add support of URL instance instead of only string in `goto`, `back` and `redirect` helpers.
* better support of hash-only links within `click` helper.
* new preferences `scroll`, `anchor` and `focus` (disabled by default) for auto-management of corresponding things. Please, read more in README.
* introducing `hook` method of `path`, `query` and `fragment` stores to get more control before it update and possible skip this update instantly, before actual router state change. Please, check an examples.
* new `breakHooks` preference to get control the behavior of hooks execution - should it be stopped immediately after first fail (by default) or all hooks should be performed in any case.

# 4.1.2
* add missed files.

# 4.1.1
* fix back helper bug using href="#<hash>" navigation.

# 4.1.0
* better SSR support.
* extended support for special links in `click` helper (eg. blob:, data:, etc.)
* code refactoring and formating.
* fix multiple `rel` attribute values.
* add LICENSE file.
* fix `back` helper bug.

# 4.0.0
* (breaking change): Now `path` store contains just an array of path segments and doesn't contain `params` field anymore. Please, check examples of `path` store and `paramable` custom store constructor to manipulate parameters.
* (breaking change): Now `query` store contains just an object of query string parameters and doesn't contain `params` field anymore. Please, check examples of `query` store.
* (breaking change): Now `pattern` store directly returns read-only `params` object if pattern was matched or `null` if not. Please, check examples in README.
* New `paramable` custom store constructor is provided to create separate `params` stores for each of possible path patterns to manipulate path parameters in ultimate flexible manner.

#### Migration guide: 
![migration](https://user-images.githubusercontent.com/4378873/221018183-678c16fc-e940-43b4-ab4e-413fa77af881.png)


# 3.4.0
* Make updating of `query` and `fragment` parts of URL state in the next tick to prevent unnecessary executions of listeners when transitioning between paths.

# 3.3.0
* Check that if `convertTypes=true` and the number after conversion is not equal to an initial value, we need to cancel conversion and keep it a string, because it seems to be too large a number.

# 3.2.3
* Move redirection to next tick.

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
