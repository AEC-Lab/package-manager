process.env.VUE_APP_VERSION = require("./package.json").version;

module.exports = {
  transpileDependencies: ["vuetify"],
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        publish: [
          {
            provider: "github",
            owner: "voyansi",
            repo: "ship"
          }
        ],
        productName: "Ship",
        nsis: {
          artifactName: "ship-setup.${ext}",
          uninstallDisplayName: "Ship"
        }
      }
    }
  },
  runtimeCompiler: true
};
