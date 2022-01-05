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
exports.writeWord = function writeWord(object, groupBy, meta) {
  let unique = {};
  let distinct = [];

  object.forEach(function (e, i) {
    if (!meta) {
      if (e[groupBy]) {
        if (!unique[e[groupBy]]) {
          if (e[groupBy].length > 0) {
            distinct.push({ bannerName: e[groupBy].toString(), index: i });
            unique[e[groupBy]] = true;
          } else if (groupBy == "complete") {
            distinct.push({ bannerName: "complete", index: i });
            unique[e[groupBy]] = true;
          } else if (!unique["n/a"]) {
            distinct.push({ bannerName: "n/a", index: i });
            unique["n/a"] = true;
          }
        }
      } else {
        if (!unique["n/a"]) {
          distinct.push({ bannerName: "n/a", index: i });
          unique["n/a"] = true;
        }
      }
    }
  });
  let newArr = object;
  distinct.forEach((banner) => {
    let index = banner.index;
    let bannerName = banner.bannerName == null ? `n/a` : banner.bannerName;
    newArr[index].bannerName = bannerName;
  });
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
    let size = 20;
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
      let dateCreated = item.dateCreated
        ? item.dateCreated.substring(0, 10)
        : "";
      let due = item.metadata.due || "";
      let done = item.complete ? "x" : "";
      let project = item.projects ? item.projects.join(", ") : "";
      let bannerName = item.bannerName || "";
      if (item.bannerName) {
        totalRows.push(
          new TableRow({
            size,
            children: [
              new TableCell({
                borders,
                margins,
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: bannerName,
                        bold: true
                      })
                    ]
                  })
                ]
              }),
              new TableCell({
                borders,
                margins,
                size,
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "", size })]
                  })
                ]
              }),
              new TableCell({
                borders,
                margins,
                size,
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "", size })]
                  })
                ]
              }),
              new TableCell({
                borders,
                margins,
                size,
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "", size })]
                  })
                ]
              }),
              new TableCell({
                borders,
                margins,

                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "", size })]
                  })
                ]
              })
            ]
          })
        );
      }

      totalRows.push(
        new TableRow({
          font: {
            size: size
          },
          children: [
            new TableCell({
              borders,
              margins,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: task,
                      size
                    })
                  ]
                })
              ]
            }),
            new TableCell({
              borders,
              margins,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: dateCreated, size })]
                })
              ]
            }),
            new TableCell({
              borders,
              margins,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: due, size })]
                })
              ]
            }),
            new TableCell({
              borders,
              margins,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: done, size })]
                })
              ]
            }),
            new TableCell({
              borders,
              margins,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: project, size })]
                })
              ]
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
