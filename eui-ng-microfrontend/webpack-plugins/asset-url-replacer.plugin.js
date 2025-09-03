// Simple webpack plugin for essential asset URL fixes only
class AssetUrlReplacerPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap('AssetUrlReplacerPlugin', (compilation) => {
      Object.keys(compilation.assets).forEach(filename => {
        if (filename.endsWith('.js')) {
          let source = compilation.assets[filename].source();
          
          // Only fix critical EUI internal icon paths that can't be handled by sprite inlining
          // Note: Most icons are now handled by SVG sprite inlining in main.single-spa.ts
          source = source.replace(/\/assets\/icons\/eui-internals\/([^"')]+)/g, 'http://localhost:4300/assets/icons/eui-internals/$1');
          
          compilation.assets[filename] = {
            source: () => source,
            size: () => source.length
          };
        }
      });
    });
  }
}

module.exports = AssetUrlReplacerPlugin;
