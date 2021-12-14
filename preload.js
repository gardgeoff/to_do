const { contextBridge, ipcRenderer } = require("electron");
window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerTExt = text;
  };
  for (const dependency of ["chrome", "node", "electron"]) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
});
contextBridge.exposeInMainWorld("api", {
  send: (channel, data) => {
    let validChannels = ["saveFile", "load"];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    let validChannels = ["loadedData"];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});
