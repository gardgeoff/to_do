const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");
const fs = require("fs");
const path = require("path");
let to_do;
fs.writeFile("./to_do.json", "[]", { flag: "wx" }, function (err) {
  let rawdata = fs.readFileSync("to_do.json");
  to_do = JSON.parse(rawdata);
});
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
    let rawdata = fs.readFileSync("to_do.json");
    to_do = JSON.parse(rawdata);
    win.webContents.send("loadedData", to_do);
  });
  ipcMain.on("saveFile", (e, args) => {
    let tempObj = args.data;
    console.log("saving");

    fs.writeFile("./to_do.json", JSON.stringify(tempObj), (err) => {
      if (err) throw err;
    });
    let tempString = ``;
    tempObj.map((item) => {
      let line = item.key + "\r\n";
      if (item.checked) {
        console.log("i'm checked");
        line = "x " + line;
      }
      tempString += line;
    });
    fs.writeFile("./to_do.txt", tempString, function (err) {
      if (err) console.log(err);
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
