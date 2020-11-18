"use strict";

import { app, protocol, BrowserWindow } from "electron";
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

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;

// messaging system for autoUpdater to render process
ipcMain.on("check-for-updates", event => {
  autoUpdater.on("checking-for-update", () => {
    event.sender.send("auto-updater-message", {
      message: "checking for updates..."
    });
  });

  autoUpdater.on("update-not-available", () => {
    event.sender.send("update-not-available");
  });

  autoUpdater.on("update-available", () => {
    event.sender.send("auto-updater-message", {
      message: "update downloading..."
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
    event.sender.send("auto-updater-message", {
      message: "installing update..."
    });
    autoUpdater.quitAndInstall();
  });

  const data = {
    provider: "github",
    owner: "AEC-Lab",
    repo: "package-manager",
    token: process.env.GH_TOKEN
  };

  autoUpdater.setFeedURL(data as any);
  autoUpdater.checkForUpdates();
});

// setup authenticator in the main process
ipcMain.on("authenticate", (event, provider, client) => {
  if (provider === "google") {
    const oauth2Client = new google.auth.OAuth2(
      client.id,
      client.secret,
      "http://localhost:3000/oauth2callback"
    );
    google.options({
      auth: oauth2Client
    });
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "select_account",
      scope: "profile email"
    });
    const server = http
      .createServer(async (req: any, res: any) => {
        if (req.url.indexOf("/oauth2callback") > -1) {
          const qs = querystring.parse(url.parse(req.url).query!);

          res.end(
            "Successfully Authenticated!  You can close this tab and return to the Package Manager application!"
          );
          server.destroy();
          // @ts-ignore
          const { tokens } = await oauth2Client.getToken(qs.code);
          event.sender.send("tokens", tokens);
        }
      })
      .listen(3000, () => {
        open(authorizeUrl, {
          wait: false
        }).then((cp: any) => cp.unref());
      });
    destroyer(server);
  } else if (provider === "github") {
    // https://docs.github.com/en/free-pro-team@latest/developers/apps/authorizing-oauth-apps
    const authorizeUrl = _getGithubAuthorizeUrl({
      client_id: client.id,
      redirect_uri: "http://localhost:3000/oauth2callback",
      scope: "read:user"
    });
    const server = http
      .createServer(async (req: any, res: any) => {
        if (req.url.indexOf("/oauth2callback") > -1) {
          const qs = querystring.parse(url.parse(req.url).query!);

          res.end(
            "Successfully Authenticated!  You can close this tab and return to the Package Manager application!"
          );
          server.destroy();
          const code = qs.code;
          const params = {
            client_id: client.id,
            client_secret: client.secret,
            code
          };
          const token = await _getGithubToken(params);
          event.sender.send("tokens", token);
        }
      })
      .listen(3000, () => {
        open(authorizeUrl, {
          wait: false
        }).then((cp: any) => cp.unref());
      });
    destroyer(server);
  }
});

function _getGithubAuthorizeUrl(params: any) {
  const url = new URL("https://github.com/login/oauth/authorize");
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

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { secure: true, standard: true } }]);

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: (process.env.ELECTRON_NODE_INTEGRATION as unknown) as boolean
    }
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
