"use strict";

import electron, { app, protocol, BrowserWindow, shell } from "electron";
import { download } from "electron-dl";
import { autoUpdater } from "electron-updater";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
const isDevelopment = process.env.NODE_ENV !== "production";

// import necessary modules for authenticator
import * as http from "http";
import * as url from "url";
import * as querystring from "querystring";
import open from "open";
import destroyer from "server-destroy";
import { google } from "googleapis";
import { ipcMain } from "electron";
import fetch from "node-fetch";
import fs from "fs";
import extract from "extract-zip";
import { PackageConfigFile } from "types/config";
import { Provider } from "../types/enums";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;

// function to return environment variables on the system
ipcMain.on("get-process-env-variable", (event, variable) => {
  event.sender.send("environment-variable-found", process.env[variable]);
});

// return config file path
ipcMain.on("get-config-path", event => {
  event.sender.send("config-path-found", getConfigFilePath());
});

// messaging system for autoUpdater to render process
ipcMain.on("check-for-updates", event => {
  autoUpdater.on("checking-for-update", () => {
    event.sender.send("auto-updater-message", {
      message: "Checking for updates..."
    });
  });

  autoUpdater.on("update-not-available", () => {
    event.sender.send("update-not-available");
  });

  autoUpdater.on("update-available", () => {
    event.sender.send("auto-updater-message", {
      message: "Updates available. Starting download..."
    });
  });

  autoUpdater.on("download-progress", progressInfo => {
    const progressPercent = Math.round(progressInfo.percent);
    event.sender.send("auto-updater-progress", {
      message: `Update downloading ${progressPercent}%...`
    });
  });

  autoUpdater.on("error", error => {
    console.error(error);
    event.sender.send("auto-updater-error", {
      message: error.message
    });
  });

  autoUpdater.on("update-downloaded", () => {
    // trigger app to close and update install
    event.sender.send("auto-updater-done", {
      message: "Installing update..."
    });
    autoUpdater.quitAndInstall();
  });

  const data = {
    provider: "github",
    owner: "voyansi",
    repo: "ship",
    token: process.env.GH_TOKEN
  };

  autoUpdater.setFeedURL(data as any);
  autoUpdater.checkForUpdates();
});

// handle window min/max/close events from title bar
ipcMain.on("close", () => {
  app.quit();
});
ipcMain.on("minimize", () => {
  win!.minimize();
});
ipcMain.on("maximize", () => {
  win!.isMaximized() ? win!.unmaximize() : win!.maximize();
});

// setup authenticator in the main process
ipcMain.on("authenticate", (event, provider, client) => {
  let authorizeUrl: string;
  let server: http.Server;
  let handleCodeCallback: HandleCodeCallback;

  switch (provider) {
    case Provider.Google:
      const oauth2Client = new google.auth.OAuth2(
        client.id,
        client.secret,
        "http://localhost:3000/oauth2callback"
      );
      google.options({
        auth: oauth2Client
      });
      authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "select_account",
        scope: "profile email"
      });

      handleCodeCallback = async code => {
        const { tokens } = await oauth2Client.getToken(code as string);
        return tokens;
      };
      server = _oAuthServerWrapper(event, authorizeUrl, handleCodeCallback);

      destroyer(server);
      break;
    case Provider.Github:
      // https://docs.github.com/en/free-pro-team@latest/developers/apps/authorizing-oauth-apps
      authorizeUrl = _getGithubAuthorizeUrl({
        client_id: client.id,
        redirect_uri: "http://localhost:3000/oauth2callback",
        scope: "read:user"
      });

      handleCodeCallback = async code => {
        const params = {
          client_id: client.id,
          client_secret: client.secret,
          code
        };
        return await _getGithubToken(params);
      };
      server = _oAuthServerWrapper(event, authorizeUrl, handleCodeCallback);

      destroyer(server);
      break;
    case Provider.Microsoft:
      // NOTE: This OAuth flow for Microsoft can currently only be used to create a custom firebase auth token,
      // which does not create an official "user" with a provider-based credential;
      // This flow is currently not being used for Microsoft (using signInWithRedirect instead), but kept here
      // for reference for potential future OAuth flow efforts

      // https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow
      // https://medium.com/@baba_nadimpalli/flutter-microsoft-active-directory-oauth2-v2-0-login-with-scopes-dc493429c9a6
      authorizeUrl = _getAzureAuthorizeUrl({
        client_id: client.id,
        response_type: "code",
        redirect_uri: "http://localhost:3000/oauth2callback",
        scope: "openid",
        response_mode: "query"
      });

      handleCodeCallback = async code => {
        const params = {
          client_id: client.id,
          scope: "openid email",
          code,
          redirect_uri: "http://localhost:3000/oauth2callback",
          grant_type: "authorization_code",
          client_secret: client.secret
        };
        return await _getAzureToken(params);
      };
      server = _oAuthServerWrapper(event, authorizeUrl, handleCodeCallback);

      destroyer(server);
      break;
  }
});

// Handle downloads for github repo assets and source code
ipcMain.on("download-github-asset", async (event, info) => {
  try {
    const response = await fetch(info.url, {
      headers: {
        Accept: info.acceptType,
        Authorization: `Bearer ${info.token}`
      },
      redirect: "manual" // prevents automatic redirect with returns 400 response
    });
    const redirectUrl = response.headers.get("location"); // URL it would otherwise redirect to (AWS S3 bucket)
    if (response.status === 302 && redirectUrl) {
      // 302 found redirects, e.g. to storage bucket; download asset with fully-authenticated download url (NO auth headers to add)
      const dl = await download(win!, redirectUrl, {
        ...info.properties,
        onProgress: progress => {
          win!.webContents.send("download-progress", progress.percent);
          win!.webContents.send("download-total", progress.totalBytes);
        }
      });
      win!.webContents.send(`download-success-${info.assetId}`, dl.getSavePath());
    } else if (response.status === 301 && redirectUrl) {
      // 301 permanent redirects, e.g. when a repo name has changed

      const response2 = await fetch(redirectUrl, {
        headers: {
          Accept: info.acceptType,
          Authorization: `Bearer ${info.token}`
        },
        redirect: "manual" // prevents automatic redirect with returns 400 response
      });
      const redirectUrl2 = response2.headers.get("location");
      if (response2.status === 302 && redirectUrl2) {
        const dl = await download(win!, redirectUrl2, {
          ...info.properties,
          onProgress: progress => {
            win!.webContents.send("download-progress", progress.percent);
            win!.webContents.send("download-total", progress.totalBytes);
          }
        });
        win!.webContents.send(`download-success-${info.assetId}`, dl.getSavePath());
      } else {
        const dl = await download(win!, redirectUrl, {
          ...info.properties,
          onProgress: progress => {
            win!.webContents.send("download-progress", progress.percent);
            win!.webContents.send("download-total", progress.totalBytes);
          }
        });
        win!.webContents.send(`download-success-${info.assetId}`, dl.getSavePath());
      }
    } else {
      win!.webContents.send(
        `download-failure-${info.assetId}`,
        `Response status ${response.status} handler not implemented`
      );
    }
  } catch (err) {
    console.log(err);
    win!.webContents.send(`download-failure-${info.assetId}`, err);
  }
});

ipcMain.on("extract-zip", async (event, info) => {
  try {
    let dirName: string | null = null;
    await extract(info.sourcePath, {
      dir: info.destPath,
      onEntry: (entry, zipFile) => {
        dirName = dirName || entry.fileName;
      }
    });
    win!.webContents.send("extract-success", info.isGithubSource ? dirName : null);
  } catch (error) {
    win!.webContents.send("extract-failure", error);
  }
});

function _getGithubAuthorizeUrl(params: any) {
  const url = new URL("https://github.com/login/oauth/authorize");
  for (const p in params) {
    url.searchParams.append(p, params[p]);
  }
  return url.href;
}

function _getAzureAuthorizeUrl(params: any) {
  const url = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
  for (const p in params) {
    url.searchParams.append(p, params[p]);
  }
  return url.href;
}

async function _getGithubToken(params: any) {
  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(params)
    });
    const jsonBody = await response.json();
    return jsonBody.access_token;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function _getAzureToken(params: any) {
  try {
    const formBody = Object.keys(params)
      .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(params[key]))
      .join("&");
    console.log(formBody);
    const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formBody
    });
    const jsonBody = await response.json();
    return jsonBody.access_token;
    // return jsonBody.id_token;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

interface HandleCodeCallback {
  (code: string | string[]): any;
}

function _oAuthServerWrapper(
  event: electron.IpcMainEvent,
  authorizeUrl: string,
  handleCode: HandleCodeCallback
) {
  const server = http
    .createServer(async (req: any, res: any) => {
      if (req.url.indexOf("/oauth2callback") > -1) {
        const qs = querystring.parse(url.parse(req.url).query!);

        res.end("Successfully Authenticated!  You can close this tab and return to the Ship application!");
        server.destroy();

        const tokenObj = await handleCode(qs.code);
        event.sender.send("tokens", tokenObj);
      }
    })
    .listen(3000, () => {
      open(authorizeUrl, {
        wait: false
      }).then((cp: any) => cp.unref());
    });
  return server;
}

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { secure: true, standard: true } }]);

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: (process.env.ELECTRON_NODE_INTEGRATION as unknown) as boolean,
      devTools: isDevelopment
    },
    frame: false
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
  }

  win.on("closed", () => {
    win = null;
  });

  win.webContents.on("new-window", (e, url) => {
    e.preventDefault();
    shell.openExternal(url);
  });
}

function getConfigFilePath() {
  const configDir = (electron.app || electron.remote.app).getPath("userData");
  return `${configDir}\\packages-config.json`;
}

function checkConfigFile() {
  // Check packages.config file
  const configPath = getConfigFilePath();
  const appVersion = (electron.app || electron.remote.app).getVersion().replace("v", "");
  if (fs.existsSync(configPath)) {
    const configObj: PackageConfigFile = JSON.parse(fs.readFileSync(configPath, "utf8"));
    // Update version if necessary
    if (appVersion !== configObj.version) {
      configObj.version = appVersion;
      fs.writeFileSync(configPath, JSON.stringify(configObj));
    }
  } else {
    // Create new file
    const newConfigObj: PackageConfigFile = { version: appVersion, packages: [] };
    fs.writeFileSync(configPath, JSON.stringify(newConfigObj));
  }
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    checkConfigFile();
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }
  checkConfigFile();
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", data => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
