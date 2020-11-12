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
            owner: "AEC-Lab",
            repo: "package-manager"
          }
        ],
        productName: "Package Manager",
        nsis: {
          artifactName: "package-manager-setup.${ext}",
          uninstallDisplayName: "Package Manager"
        }
      }
    }
  },
  runtimeCompiler: true
};
