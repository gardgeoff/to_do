const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  globalShortcut
} = require("electron");
const {
  Document,
  BorderStyle,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType
} = require("docx");
const parser = require("todotxt-parser");
const fs = require("fs");
const path = require("path");
const excelJs = require("exceljs");
const workbook = new excelJs.Workbook();
const worksheet = workbook.addWorksheet("to_do");
let to_do;
let arr = [];
function readTextFile() {
  const read = fs.readFileSync("to_do.txt", "utf-8");
  console.log(read);
  read.split(/\r?\n/).forEach((line) => {
    arr.push(parser.relaxed(line));
  });
  console.log(arr);
}
readTextFile();

fs.writeFile("./to_do.json", "[]", { flag: "wx" }, function (err) {
  let rawdata = fs.readFileSync("to_do.json");
  to_do = JSON.parse(rawdata);
});
worksheet.columns = [
  { header: "task", key: "text", width: 30 },
  { header: "complete", key: "checked", width: 10 },
  { header: "created", key: "date", width: 10 },
  { header: "due", key: "due", width: 10 },
  { header: "priority", key: "priority", width: 10 },
  { header: "project", key: "project", width: 10 },
  { header: "context", key: "context", width: 10 },
  { header: "sprint", key: "sprint", width: 10 },
  { header: "poc", key: "poc", width: 10 }
];

function writeXl() {
  to_do.forEach((item) => {
    if (item.checked) {
      item.checked = "x";
    } else {
      item.checked = "";
    }
    worksheet.addRow(item);
  });
  try {
    const data = workbook.xlsx.writeFile(`./to_do.xlsx`).then(() => {
      console.log("success");
    });
  } catch (err) {
    console.log("error");
  }
}
function writeWord() {}
function writeTxt() {}
async function createWindow() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "file",
        submenu: [
          {
            label: "export",
            submenu: [
              {
                label: "excel",
                click() {
                  writeXl();
                }
              },
              {
                label: "word",
                click() {
                  writeWord();
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
            label: "open dev tools",
            click() {
              win.openDevTools();
            }
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
app.whenReady().then(() => {
  createWindow();
  ipcMain.on("load", (e, args) => {
    let rawdata = fs.readFileSync("to_do.json");
    to_do = JSON.parse(rawdata);
    win.webContents.send("loadedData", to_do);
  });
  ipcMain.on("saveFile", (e, args) => {
    let tempObj = args.data;
    fs.writeFile("./to_do.json", JSON.stringify(tempObj), (err) => {
      if (err) throw err;
    });
    let tempString = ``;
    tempObj.map((item) => {
      let prio = item.priority ? `(${item.priority}) ` : "";
      let line =
        `${prio}${item.date || ""} ${item.text || ""} ${item.project || ""} ${
          item.context || ""
        } ${item.due || ""} \r\n` || "";
      if (item.checked) {
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
