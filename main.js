const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  globalShortcut
} = require("electron");
const fs = require("fs");
const path = require("path");
let to_do = require("./scripts/to_do.json");
let win;
async function createWindow() {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteMOdule: false,
      preload: path.join(__dirname, "./preload.js")
    }
  });
  win.loadFile("index.html");
}
app.whenReady().then(() => {
  createWindow();
  ipcMain.on("load", (e, args) => {
    win.webContents.send("loadedData", to_do);
  });
  ipcMain.on("saveFile", (e, args) => {
    let tempObj = args.data;
    console.log("saving");

    fs.writeFile("./scripts/to_do.json", JSON.stringify(tempObj), (err) => {
      if (err) throw err;
    });
  });
  globalShortcut.register("f5", () => {
    win.reload();
  });
  globalShortcut.register("escape", () => {
    win.setFullScreen(false);
  });
});
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
