const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  globalShortcut,
  dialog
} = require("electron");
const parser = require("todotxt-parser");
const fs = require("fs");
const path = require("path");
let word = require("./scripts/writeword");
let excel = require("./scripts/writexl");
let to_do;
// Guy Thomas SO answer for unique id
function uniqueid() {
  // always start with a letter (for DOM friendlyness)
  var idstr = String.fromCharCode(Math.floor(Math.random() * 25 + 65));
  do {
    // between numbers and characters (48 is 0 and 90 is Z (42-48 = 90)
    var ascicode = Math.floor(Math.random() * 42 + 48);
    if (ascicode < 58 || ascicode > 64) {
      // exclude all chars between : (58) and @ (64)
      idstr += String.fromCharCode(ascicode);
    }
  } while (idstr.length < 32);

  return idstr;
}
function saveToJson(data) {
  fs.writeFile("./to_do.json", JSON.stringify(data), (err) => {
    if (err) throw err;
    rebuildScene();
  });
}

function saveToTxt(data, directory) {
  let tempString = ``;
  data.map((item) => {
    let line =
      item.complete && !item.raw.startsWith("x") ? "x " + item.raw : item.raw;
    line = line.includes("uid:")
      ? line.substring(0, line.indexOf("uid:"))
      : line;
    line = line + "\r\n";
    tempString += line;
  });

  fs.writeFile(directory, tempString, function (err) {});
}
function rebuildScene() {
  let rawdata = fs.readFileSync("to_do.json");
  to_do = JSON.parse(rawdata);
  win.webContents.send("loadedData", to_do);
}
function stripText(string) {
  let text = string;
  if (text.includes("+")) {
    text = text.substring(0, text.indexOf("+"));
  }
  if (text.includes("@")) {
    text = text.substring(0, text.indexOf("@"));
  } else if (text.includes("due:")) {
    text = text.substring(0, text.indexOf("due:"));
  } else if (text.includes("sprint:")) {
    text = text.substring(0, text.indexOf("sprint:"));
  } else if (text.includes("poc:")) {
    text = text.substring(0, text.indexOf("poc:"));
    // tests for any other meta data strings using the format foo:bar
  } else if (/\w+:\w/gm.test(text)) {
    text = text.substring(0, text.indexOf(text.match(/\w+:\w/gm)[0]));
  } else {
    text = text;
  }
  return text;
}
function readTxtFile(directory) {
  let arr = [];
  const read = fs.readFileSync(directory, "utf-8");
  read.split(/\r?\n/).forEach((line) => {
    arr.push(parser.relaxed(line));
  });

  let newA = [];
  arr.map((item) => {
    item[0].metadata.uid = uniqueid();
    item[0].dateCreated =
      item[0].dateCreated != null ? item[0].dateCreated.substring(0, 10) : null;
    item[0].text = stripText(item[0].text);
    if (item[0].text.length > 0) {
      newA.push(item[0]);
    }
  });
  to_do = newA;
  saveToJson(to_do);
}
function sendEdit(command) {
  win.webContents.send("edit", { command });
}

function writeTxt() {
  let options = {
    title: "Save",
    defaultPath: "./",
    buttonLabel: "save",
    filters: [{ name: "Text Files", extensions: ["txt"] }]
  };
  dialog.showSaveDialog(win, options).then(function (res) {
    let filePath = res.filePath;
    saveToTxt(to_do, filePath);
  });
}
function newFile() {}

function openFile() {
  let options = {
    title: "select",
    defaultPath: "./",
    buttonLabel: "open",
    filters: [{ name: "Text Files", extensions: ["txt"] }],
    properties: ["openFile"]
  };
  dialog.showOpenDialog(win, options).then(function (res) {
    let dir = res.filePaths[0];
    readTxtFile(dir);
  });
}
async function createWindow() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "file",
        submenu: [
          {
            label: "save",
            click() {
              saveToTxt(to_do, "./to_do.txt");
              saveToJson(to_do);
            }
          },
          {
            label: "new",
            click() {
              newFile();
            }
          },
          {
            label: "open",
            click() {
              openFile();
            }
          },
          {
            label: "export",
            submenu: [
              {
                label: "excel",
                click() {
                  excel.writeXl(to_do);
                }
              },
              {
                label: "word",
                click() {
                  word.writeWord(to_do);
                }
              },
              {
                label: "txt",
                click() {
                  writeTxt();
                }
              }
            ]
          },
          {
            label: "quit",
            click() {
              app.quit();
            }
          }
        ]
      },
      {
        label: "edit",
        submenu: [
          {
            label: "increase priority",
            click() {
              sendEdit("upPrio");
            },
            accelerator: "Ctrl+Up"
          },
          {
            label: "decrease priority",
            click() {
              sendEdit("downPrio");
            },
            accelerator: "Ctrl+Down"
          },
          {
            label: "alter text",
            click() {
              sendEdit("alter text");
            },
            accelerator: "Ctrl+E"
          },
          {
            label: "open dev tools",
            click() {
              win.openDevTools();
            },
            accelerator: "Ctrl+Shift+I"
          }
        ]
      }
    ])
  );
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
  win.webContents.openDevTools();
  win.loadFile("index.html");
}
let emptyArr = [];

app.whenReady().then(() => {
  createWindow();
  ipcMain.on("load", (e, args) => {
    rebuildScene();
  });
  ipcMain.on("toParse", (e, args) => {
    let toDecipher = args.data;
    let returnObj = parser.relaxed(toDecipher);
    returnObj[0].text = stripText(returnObj[0].text);

    e.sender.send("parsed", returnObj);
  });
  ipcMain.on("saveFile", (e, args) => {
    let tempObj = args.data;
    saveToJson(tempObj);
    saveToTxt(tempObj, "./to_do.txt");
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
