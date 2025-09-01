// Custom webpack plugin to replace asset URLs
class AssetUrlReplacerPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap('AssetUrlReplacerPlugin', (compilation) => {
      Object.keys(compilation.assets).forEach(filename => {
        if (filename.endsWith('.js')) {
          let source = compilation.assets[filename].source();
          
          // Replace relative asset URLs with absolute microfrontend URLs
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
