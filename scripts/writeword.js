const { dialog } = require("electron");
const fs = require("fs");
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
exports.writeWord = function writeWord(object) {
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
    object.map((item) => {
      let task = item.text || "";
      let dateCreated = item.dateCreated || "";
      let due = item.metadata.due || "";
      let done = item.complete ? "x" : "";
      let project = item.projects ? item.projects.join(", ") : "";

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
};
