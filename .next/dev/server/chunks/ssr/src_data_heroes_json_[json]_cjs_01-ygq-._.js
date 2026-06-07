module.exports = [
"[project]/src/data/heroes.json.[json].cjs [app-ssr] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/src_data_heroes_json_[json]_cjs_0q~5n9a._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/src/data/heroes.json.[json].cjs [app-ssr] (ecmascript)");
    });
});
}),
];