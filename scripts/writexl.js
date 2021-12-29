const { dialog } = require("electron");
const excelJs = require("exceljs");
exports.writeXl = function writeXl(object) {
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

    object.forEach((item) => {
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
};
