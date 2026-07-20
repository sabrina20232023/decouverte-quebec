module.exports = function (options) {
    return {
        ...options,

        resolve: {
            ...options.resolve,

            extensionAlias: {
                '.js': ['.ts', '.js'],
                '.cjs': ['.cts', '.cjs'],
                '.mjs': ['.mts', '.mjs'],
            },
        },
    };
};