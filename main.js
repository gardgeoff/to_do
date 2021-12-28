const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  globalShortcut,
  dialog
} = require("electron");
const {
  Document,
  BorderStyle,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  Tablerow,
  convertInchesToTwip,
  TextRun
} = require("docx");
const parser = require("todotxt-parser");
const fs = require("fs");
const path = require("path");
const excelJs = require("exceljs");

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
  console.log(data);
  let tempString = ``;
  data.map((item) => {
    let line = item.raw;

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
    console.log(item[0].dateCreated);
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

// fs.writeFile("./to_do.json", "[]", { flag: "wx" }, function (err) {
//   let rawdata = fs.readFileSync("to_do.json");
//   to_do = JSON.parse(rawdata);
// });
function increasePrio() {}
function decreasePrio() {}
function updateTask() {}
function writeXl() {
  let filepath;
  let options = {
    title: "Save",
    defaultPath: "./",
    buttonLabel: "save",
    filters: [{ name: "Excel", extensions: [".xlsx"] }]
  };
  dialog.showSaveDialog(win, options).then(function (res) {
    filepath = res.filePath;

    const workbook = new excelJs.Workbook();
    const worksheet = workbook.addWorksheet("to_do");
    worksheet.columns = [
      { header: "task", key: "text", width: 30 },
      { header: "complete", key: "complete", width: 10 },
      { header: "created", key: "dateCreated", width: 10 },
      { header: "due", key: "due", width: 10 },
      { header: "priority", key: "priority", width: 10 },
      { header: "project", key: "projects", width: 10 },
      { header: "context", key: "contexts", width: 10 },
      { header: "sprint", key: "sprint", width: 10 },
      { header: "poc", key: "poc", width: 10 }
    ];

    let tempArr = to_do;
    tempArr.forEach((item) => {
      let projects = item.projects;
      let contexts = item.contexts;
      item.projects = Array.isArray(projects) ? projects.join(", ") : projects;
      item.contexts = Array.isArray(contexts) ? contexts.join(", ") : "";
      item.complete = item.complete ? "x" : "";
      item.metadata.sprint ? (item.sprint = item.metadata.sprint) : null;
      item.metadata.poc ? (item.poc = item.metadata.poc) : null;
      item.metadata.due ? (item.due = item.metadata.due) : null;

      worksheet.addRow(item);
    });
    try {
      const data = workbook.xlsx.writeFile(filepath).then(() => {});
    } catch (err) {}
  });
}
function writeWord() {
  let filePath;
  let options = {
    title: "Save",
    defaultPath: "./",
    buttonLabel: "save",
    filters: [{ name: "Word Document", extensions: ["docx"] }]
  };
  dialog.showSaveDialog(win, options).then(function (res) {
    filePath = res.filePath;

    const borders = {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
    };
    let margins = {
      top: convertInchesToTwip(0.03),
      bottom: convertInchesToTwip(0.03),
      right: convertInchesToTwip(0.03),
      left: convertInchesToTwip(0.03)
    };
    let totalRows = [
      new TableRow({
        children: [
          new TableCell({
            borders,
            margins,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Task",
                    bold: true
                  })
                ]
              })
            ],
            width: {
              size: convertInchesToTwip(3.5),
              type: WidthType.DXA
            }
          }),
          new TableCell({
            borders,
            margins,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Created",
                    bold: true
                  })
                ]
              })
            ],
            width: {
              size: convertInchesToTwip(0.75),
              type: WidthType.DXA
            }
          }),
          new TableCell({
            borders,
            margins,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Due",
                    bold: true
                  })
                ]
              })
            ],
            width: {
              size: convertInchesToTwip(0.75),
              type: WidthType.DXA
            }
          }),
          new TableCell({
            borders,
            margins,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Done",
                    bold: true
                  })
                ]
              })
            ],
            width: {
              size: convertInchesToTwip(0.5),
              type: WidthType.DXA
            }
          }),
          new TableCell({
            borders,
            margins,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Project",
                    bold: true
                  })
                ]
              })
            ],
            width: {
              size: convertInchesToTwip(1.0),
              type: WidthType.DXA
            }
          })
        ]
      })
    ];
    to_do.map((item) => {
      let task = item.text || "";
      let dateCreated = item.dateCreated || "";
      let due = item.due || "";
      let done = item.complete ? "x" : "";
      let project = item.projects.join(", ") || "";

      totalRows.push(
        new TableRow({
          children: [
            new TableCell({
              borders,
              margins,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: task
                    })
                  ]
                })
              ]
            }),
            new TableCell({
              borders,
              margins,
              children: [new Paragraph(dateCreated)]
            }),
            new TableCell({
              borders,
              margins,
              children: [new Paragraph(due)]
            }),
            new TableCell({
              borders,
              margins,
              children: [new Paragraph(done)]
            }),
            new TableCell({
              borders,
              margins,
              children: [new Paragraph(project)]
            })
          ]
        })
      );
    });
    const table = new Table({
      rows: totalRows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      }
    });

    const doc = new Document({
      styles: {
        paragraphStyles: [
          {
            name: "Normal",
            run: {
              size: 24,
              font: "Calibri"
            }
          }
        ]
      },
      sections: [{ children: [table] }]
    });
    Packer.toBuffer(doc).then((buffer) => {
      fs.writeFileSync(filePath, buffer);
    });
  });
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
            label: "increase priority",
            click() {
              increasePrio();
            }
          },
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
