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
let sorting = "priority";

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
  if (typeof data == "object") {
    // not empty file
    data.map((item) => {
      let line =
        item.complete && !item.raw.startsWith("x") ? "x " + item.raw : item.raw;
      line = line.includes("uid:")
        ? line.substring(0, line.indexOf("uid:"))
        : line;
      line = line + "\r\n";
      tempString += line;
    });
  }

  fs.writeFile(directory, tempString, function (err) {
    if (data == "") {
      readTxtFile(directory);
    }
  });
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
  }
  if (text.includes("due:")) {
    text = text.substring(0, text.indexOf("due:"));
  }
  if (text.includes("sprint:")) {
    text = text.substring(0, text.indexOf("sprint:"));
  }
  if (text.includes("poc:")) {
    text = text.substring(0, text.indexOf("poc:"));
    // tests for any other meta data strings using the format foo:bar
  }
  if (/\w+:\w/gm.test(text)) {
    text = text.substring(0, text.indexOf(text.match(/\w+:\w/gm)[0]));
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
function newFile() {
  let options = {
    title: "New Txt File",
    defaultPath: "./",
    buttonLabel: "create",
    filters: [{ name: "txt", extensions: ["txt"] }]
  };
  dialog.showSaveDialog(win, options).then(function (res) {
    let filePath = res.filePath;
    saveToTxt("", filePath);
  });
}

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
        label: "File",
        submenu: [
          {
            label: "New",
            click() {
              newFile();
            },
            accelerator: "Ctrl+N"
          },
          {
            label: "Save",
            click() {
              saveToTxt(to_do, "./to_do.txt");
              saveToJson(to_do);
            },
            accelerator: "Ctrl+S"
          },
          {
            label: "Save As",
            click() {
              writeTxt();
            },
            accelerator: "Ctrl+Shift+S"
          },

          {
            label: "Open",
            click() {
              openFile();
            },
            accelerator: "Ctrl+O"
          },
          {
            label: "Export",
            submenu: [
              {
                label: "Excel",
                click() {
                  excel.writeXl(to_do);
                }
              },
              {
                label: "Word",
                click() {
                  word.writeWord(to_do, sorting);
                }
              }
            ]
          },
          {
            label: "Quit",
            click() {
              app.quit();
            },
            accelerator: "Ctrl+Q"
          }
        ]
      },
      {
        label: "Edit",
        submenu: [
          {
            label: "Increase Priority",
            click() {
              sendEdit("upPrio");
            },
            accelerator: "Alt+Up"
          },
          {
            label: "Decrease Priority",
            click() {
              sendEdit("downPrio");
            },
            accelerator: "Alt+Down"
          },
          {
            label: "Remove Priority",
            click() {
              sendEdit("removePrio");
            }
          },
          {
            label: "Alter Text",
            click() {
              sendEdit("alter text");
            },
            accelerator: "Ctrl+E"
          },
          {
            label: "Open Dev Tools",
            click() {
              win.openDevTools();
            },
            accelerator: "Ctrl+Shift+I"
          }
        ]
      },
      {
        label: "Group",
        submenu: [
          {
            label: "Priority",
            click() {
              sendEdit("groupPrio");
              sorting = "priority";
            },
            accelerator: "Ctrl+1"
          },
          {
            label: "Project",
            click() {
              sendEdit("groupProj");
              sorting = "projects";
            },
            accelerator: "Ctrl+2"
          },
          {
            label: "Context",
            click() {
              sendEdit("groupContext");
              sorting = "contexts";
            },
            accelerator: "Ctrl+3"
          },
          {
            label: "Complete",
            click() {
              sendEdit("complete");
              sorting = "complete";
            },
            accelerator: "Ctrl+4"
          },
          {
            label: "Metadata Tag",
            click() {
              sendEdit("groupMeta");
              sorting = "metadata";
            },
            accelerator: "Ctrl+5"
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
