$(function () {
  // initialize empty array to hold "to do list" data
  let mainArr = [];
  let selected;
  let currentSorting = "priority";
  let isMeta = false;
  let nonMeta = ["projects", "priority", "contexts", "complete"];
  // send signal to main and retrieve the locally saved data
  // assign data to mainArr array and rebuild() to generate the screen
  window.api.send("load", true);
  window.api.receive("loadedData", function (data) {
    mainArr = data;
    rebuild(currentSorting);
  });
  function orderArray(array) {
    array.sort((x, y) => {
      return x.complete - y.complete;
    });
    array.sort((x, y) => {
      return x.priority < y.priority
        ? -1
        : x.priority > y.priority
        ? 1
        : !y.priority && x.priority
        ? -1
        : 0;
    });
    if (!isMeta && currentSorting != "priority") {
      array.sort((x, y) => {
        return x[currentSorting] < y[currentSorting]
          ? 1
          : x[currentSorting] > y[currentSorting]
          ? -1
          : !y[currentSorting] && x[currentSorting]
          ? -1
          : !x[currentSorting];
      });
    } else if (isMeta && currentSorting != "priority") {
      array.sort((x, y) => {
        return x.metadata[currentSorting] < y.metadata[currentSorting]
          ? 1
          : x.metadata[currentSorting] > y.metadata[currentSorting]
          ? -1
          : !y.metadata[currentSorting] && x.metadata[currentSorting]
          ? -1
          : 0;
      });
      array.sort((x, y) => {
        return x.complete - y.complete;
      });
    }
  }
  // Guy Thomas SO answer to unique id
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
  function metaSelect() {
    let metaKeys = [];
    mainArr.map((item) => {
      for (key in item.metadata) {
        metaKeys.includes(key)
          ? null
          : key === "uid"
          ? null
          : metaKeys.push(key);
      }
    });
    metaKeys.map((key) => {
      let selectOption = `<option value="${key}">${key}</option> `;
      $("#meta-select").append(selectOption);
    });

    $(".popup").fadeIn("fast");
  }

  // main function to rebuild the scene whenever something changes
  function rebuild(sortby) {
    currentSorting = sortby;
    if (nonMeta.includes(currentSorting)) {
      isMeta = false;
    }
    console.log(`rebuild sorted by: ${sortby}`);
    $(".list-container").empty();
    let banners = [];

    orderArray(mainArr);
    // makeSortable() causes lists to be drag and drop
    makeSortable();
    mainArr.map((item) => {
      let raw = item.raw;
      let prio = item.priority;
      let dateCreated = item.dateCreated
        ? item.dateCreated.substring(0, 10)
        : "";
      let text = item.text;
      let uid = item.metadata.uid;
      let projects = item.projects.join(" +");
      projects == "" ? null : (projects = "+" + projects);
      let contexts = item.contexts.join(" @");
      contexts == "" ? null : (contexts = "@" + contexts);
      let metaArr = [];
      for (var key in item.metadata) {
        if (item.metadata.hasOwnProperty(key)) {
          if (key != "uid") {
            metaArr.push(key + ":" + item.metadata[key]);
          }
        }
      }
      let metaString = metaArr.join(" ");
      let baseDiv = `
      <div
        raw="${raw}"
        class=
        "list-item ${prio}"
        uid="${uid}"
        text="${text}"
        >
          <input type=checkbox class="check" connected="${uid}"/>
          <span class="raw-text line-through">${
            prio ? `(${prio})` : ""
          } ${dateCreated} ${text} ${projects} ${contexts} ${metaString} </span>
          <button class="del-item btn btn-danger">-</button>
      </div>`;
      $(".list-container").append(baseDiv);
      if (item.complete) {
        $(`input[connected=${uid}]`).prop("checked", true).siblings().css({
          textDecoration: "line-through"
        });
      }
    });
    let included = [];
    mainArr.map((item) => {
      let newBanner;
      if (!isMeta) {
        if (item[currentSorting]) {
          if (item[currentSorting].length > 0) {
            newBanner = item[currentSorting].toString();
          } else if (currentSorting == "complete") {
            newBanner = `complete`;
          } else {
            newBanner = `no ${currentSorting}`;
          }
        } else {
          newBanner =
            currentSorting == "complete"
              ? `not ${currentSorting}`
              : `no ${currentSorting}`;
        }
        if (!included.includes(newBanner)) {
          banners.push({ bannerName: newBanner, insertAt: item.metadata.uid });
          included.push(newBanner);
        }
      } else if (isMeta) {
        if (item.metadata[currentSorting]) {
          if (item.metadata[currentSorting].length > 0) {
            newBanner = item.metadata[currentSorting].toString();
          } else {
            newBanner = `no ${currentSorting}`;
          }
        } else {
          newBanner = `no ${currentSorting}`;
        }
        if (!included.includes(newBanner)) {
          banners.push({ bannerName: newBanner, insertAt: item.metadata.uid });
          included.push(newBanner);
        }
      }
    });
    banners.map((item) => {
      let id = item.insertAt;
      let bannerText = `<div class="banner">${item.bannerName}</div>`;
      $(bannerText).insertBefore(`div[uid="${id}"]`);
    });

    checkDates();
  }

  function checkDates() {
    $(".list-item").each(function (i, mainArr) {
      let dueDate = $(mainArr).attr("due");
      let now = moment(Date.now()).format("YYYY/MM/DD");
      let diffInDays = moment(dueDate).diff(now, "days");
      if (diffInDays <= 1) {
        // $(this).css({ color: "red" });
      }
    });
  }
  function addNewLine(obj) {
    mainArr.push(obj);
    rebuild(currentSorting);
  }
  function makeSortable() {
    $(".sortable")
      .sortable({
        containment: "parent",
        cancel: ".banner",
        stop: function (event, ui) {
          if (currentSorting == "priority") {
            let uid = $(ui.item).attr("raw");
            let newPrio = $(ui.item).prevAll(".banner:first").text();
            newPrio == "no priority" ? (newPrio = null) : (newPrio = newPrio);
            console.log(newPrio);
            let newPrioRaw = newPrio != null ? "(" + newPrio + ")" : "";
            for (let i = 0; i < mainArr.length; i++) {
              if (mainArr[i].raw == uid) {
                if (mainArr[i].priority != null) {
                  mainArr[i].raw = mainArr[i].raw
                    .replace("(" + mainArr[i].priority + ")", newPrioRaw)
                    .trim();
                } else {
                  mainArr[i].raw = newPrioRaw + " " + mainArr[i].raw;
                }
                mainArr[i].priority = newPrio;
              }
            }
            rebuild(currentSorting);
          }
        },
        update: function () {
          var tempItems = [];
          $(".sortable")
            .children()
            .each(function (i) {
              let raw = $(this).attr("raw");
              mainArr.map((item) => {
                if (item.raw == raw) {
                  tempItems.push(item);
                }
              });
            });

          updateSortOrderJS(tempItems);
        }
      })
      .disableSelection();
  }
  function updateSortOrderJS(param) {
    mainArr = param;
  }
  function nextChar(c) {
    return c.toUpperCase() != "Z"
      ? String.fromCharCode(c.charCodeAt(0) + 1)
      : c;
  }
  function prevChar(c) {
    return c.toUpperCase() != "A"
      ? String.fromCharCode(c.charCodeAt(0) - 1)
      : c;
  }

  function editItem(command) {
    if (command === "groupPrio") {
      rebuild("priority");
    } else if (command === "groupProj") {
      rebuild("projects");
    } else if (command === "groupContext") {
      rebuild("contexts");
    } else if (command === "groupMeta") {
      metaSelect();
    } else if (command === "complete") {
      rebuild("complete");
    }
    if (selected) {
      let item = mainArr.find((e) => {
        return e.metadata.uid == selected;
      });
      if (command === "alter text") {
        let text = item.raw;
        if (text.includes("uid:")) {
          text = text.substring(0, text.indexOf("uid:"));
        }
        $("#todotext").val(text);
        mainArr = mainArr.filter((item) => {
          return item.metadata.uid != selected;
        });
      } else if (
        command === "upPrio" ||
        command === "downPrio" ||
        command == "removePrio"
      ) {
        let [priority] = item.priority;
        if (priority) {
          let uid = item.metadata.uid;
          mainArr.forEach((task) => {
            if (task.metadata.uid === uid) {
              if (command == "upPrio") {
                task.raw = task.raw.replace(
                  `(${task.priority})`,
                  "(" + prevChar(priority) + ")"
                );
                task.priority = [prevChar(priority)];
              } else if (command == "downPrio") {
                task.raw = task.raw.replace(
                  `(${task.priority})`,
                  "(" + nextChar(priority) + ")"
                );
                task.priority = [nextChar(priority)];
              } else if (command == "removePrio") {
                console.log("removing prio");
                task.raw = task.raw.replace(`(${task.priority})`, "").trim();
                task.priority = null;
              }
            }
          });
        }
      } else if (command === "removePrio") {
      }
      rebuild(currentSorting);
    }
  }
  $("#todotext").on("keydown", function (e) {
    if (e.key === "Enter") {
      let uid = uniqueid();
      let phrase = $(this).val() + ` uid:${uid}`;
      let isHtml = /<\/?[a-z][\s\S]*>/i.test(phrase);
      let tags = /[<>]/gm.test(phrase);
      if (isHtml) {
        $("#todotext").val("");
      } else {
        window.api.send("toParse", { data: phrase });
      }
    }
  });
  window.api.receive("parsed", function (data) {
    addNewLine(data[0]);
    $("#todotext").val("");
  });
  window.api.receive("edit", function (data) {
    let command = data.command;
    editItem(command);
  });
  $(document).on("click", ".check", function () {
    let isChecked = $(this).is(":checked");
    if (isChecked) {
      let connected = $(this).attr("connected");
      for (let i = 0; i < mainArr.length; i++) {
        if (mainArr[i].metadata.uid == connected) {
          mainArr[i].complete = true;
          if (!mainArr[i].raw.startsWith("x ")) {
            mainArr[i].raw = "x " + mainArr[i].raw;
          }
          rebuild(currentSorting);
        }
      }
    } else {
      $(this).closest("div").attr("checked", "false");
      let connected = $(this).attr("connected");
      for (let i = 0; i < mainArr.length; i++) {
        if (mainArr[i].metadata.uid == connected) {
          mainArr[i].complete = false;
          if (mainArr[i].raw.startsWith("x ")) {
            mainArr[i].raw = mainArr[i].raw.replace("x ", "");
          }
          rebuild(currentSorting);
        }
      }
    }
    // window.api.send("saveFile", { data: mainArr });
  });
  let keys = {};
  $(document).on("keydown", function (e) {
    keys[e.which] = true;

    // ctrl + s to save
    if (keys[17] && keys[83]) {
      mainArr.forEach((item) => {
        item.raw = item.raw.trim();
      });
      window.api.send("saveFile", { data: mainArr });
    }
  });
  $(document).keyup(function (e) {
    delete keys[e.which];
  });
  $(".search-input").on("keyup", (e) => {
    let totalSearch = $(".search-input").val();
    $(".list-item").each(function () {
      let content = $(this).text().toUpperCase();
      totalSearch = totalSearch.toUpperCase();
      if (!content.includes(totalSearch)) {
        $(this).hide();
      } else {
        $(this).show();
      }
    });
  });
  $(document).on("mouseup", ".list-item", function (e) {
    if (this === e.target) {
      let xPos = e.pageX;
      let yPos = e.pageY;
      if (e.which == 3) {
        let text = $(this).attr("text");
        navigator.clipboard.writeText(text);
        $("#tooltip").css({
          top: yPos,
          left: xPos
        });
        $("#tooltip").fadeIn("fast", function () {
          setTimeout(() => {
            $("#tooltip").fadeOut("fast");
          }, 500);
        });
      } else if (e.which == 1) {
        let id = $(this).attr("uid");
        $(".list-item").css("outline", "none");
        $(this).css({
          outline: "2px solid #293241"
        });
        selected = id;
      }
    }
  });

  $(document).on("click", ".del-item", function () {
    let uid = $(this).closest(".list-item").attr("uid");
    $(this).closest(".list-item").hide();
    mainArr = mainArr.filter((item) => {
      return item.metadata.uid != uid;
    });
    rebuild(currentSorting);
  });
  $("#meta-select").on("change", function () {
    currentSorting = $("#meta-select").val();

    isMeta = true;
    rebuild(currentSorting);
  });
  $(".btn-sort").on("click", function () {
    currentSorting = $("#meta-select").val();
    isMeta = true;
    rebuild(currentSorting);
  });
  $(".sort-btn").on("change", function () {
    currentSorting = $("#meta-select").val();
    isMeta = true;
    rebuild(currentSorting);
  });
  $(".close-popup").on("click", function () {
    $(".popup").fadeOut("fast");
  });
  $(document)
    .on("mouseover", ".list-item", function () {
      $(this).find(".del-item:first").css("visibility", "visible");
    })
    .on("mouseout", ".list-item", function () {
      $(this).find(".del-item:first").css("visibility", "hidden");
    });
  // 30 minute auto save interval
  setInterval(() => {
    if (mainArr.length > 0) {
      window.api.send("saveFile", { data: mainArr });
    }
  }, 1800000);
});
