const pkg = require('./package.json');

module.exports = function () {
	try {
		const mod = require.resolve(`../${pkg.name}`);

		delete require.cache[mod];
		Object.keys(module.constructor._pathCache).forEach((cacheKey) => {
			if (cacheKey.indexOf(mod) > -1) {
				delete module.constructor._pathCache[cacheKey];
			}
		});

		return require(mod);
	} catch (err) {
		throw new Error("Decaching wasn't performed.");
	}
}
