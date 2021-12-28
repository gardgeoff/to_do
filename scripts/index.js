$(function () {
  // initialize empty array to hold "to do list" data
  let mainArr = [];
  let selected;
  // send signal to main and retrieve the locally saved data
  // assign data to mainArr array and rebuild() to generate the screen
  window.api.send("load", true);
  window.api.receive("loadedData", function (data) {
    mainArr = data;
    console.log(mainArr);
    rebuild();
  });
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
  // main function to rebuild the scene whenever something changes
  function rebuild() {
    $(".list-container").empty();
    let banners = [];
    let listItems = [];
    mainArr.map((item) => {
      if (item.priority && item.priority.length) {
        !banners.includes(item.priority)
          ? banners.push(`${item.priority}`)
          : null;
      } else if (!item.priority) {
        !banners.includes("no_priority") ? banners.push("no_priority") : null;
      }
      listItems.push(item);
    });
    // sort priority alphabetically
    // sort no priority last
    listItems.sort((x, y) => {
      return x.complete - y.complete;
    });
    listItems.sort((x, y) => {
      return x.priority < y.priority
        ? -1
        : x.priority > y.priority
        ? 1
        : !y.priority && x.priority
        ? -1
        : 0;
    });

    // makeSortable() causes lists to be drag and drop
    makeSortable();
    listItems.map((item) => {
      console.log(item);
      let raw = item.raw;
      let prio = item.priority;
      let dateCreated = item.dateCreated || "";
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
          <button class="del-item btn btn-danger">delete</button>
      </div>`;

      $(".list-container").append(baseDiv);

      if (item.complete) {
        $(`input[connected=${uid}]`).prop("checked", true).siblings().css({
          textDecoration: "line-through"
        });
      }
    });

    !banners.includes("null") ? banners.push("null") : null;
    banners.map((item) => {
      let insert;
      let string;

      if (item != "null" && item != "complete") {
        insert = $("." + item).first();
        string = `<div class="banner banner-${item}">${item}</div>`;
      } else {
        insert = $(".null").first();
        string = `<div class="banner banner-${item}">no priority</div>`;
      }
      $(string).insertBefore(insert);
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
  // grab inputs and create a new to do item
  function addNew() {
    let priority = $("#priority").val().trim();
    let todo = $("#todotext").val().trim();
    let due = $("#due").val() == "" ? "" : `${$("#due").val()}`;
    let sprint = $("#sprint").val().trim() || "";
    let poc = $("#poc").val().trim() || "";
    let project = $("#project").val().trim();
    let context = $("#context").val().trim();
    let created = Date.now();
    let date = moment(Date.now()).format("YYYY-MM-DD");
    let prioNoParenthesis;
    // test if priority exists and is A-Z
    if (priority && /^[a-zA-Z]+$/.test(priority)) {
      let tempPrio = priority.match(/^[a-zA-Z]+$/)[0];
      tempPrio = tempPrio.toUpperCase();
      prioNoParenthesis = tempPrio;
      tempPrio = "(" + tempPrio + ")";
      priority = tempPrio;
    }
    if (project && !project.startsWith("+")) {
      project = "+" + project;
    }
    if (context && !context.startsWith("@")) {
      context = "@" + context;
    }
    if (todo) {
      mainArr.push({
        checked: false,
        priority: prioNoParenthesis,
        text: todo,
        project,
        context,
        sprint,
        poc,
        created,
        due,
        date
      });
      rebuild();
      $("input").val("");
    }
  }
  function addNewLine(obj) {
    let date = moment(Date.now()).format("YYYY-MM-DD");
    let text = obj.text.trim();
    let { priority, projects, contexts, complete, metadata, raw } = obj;
    mainArr.push({
      dateCreated: date,
      text,
      complete,
      priority,
      projects,
      contexts,
      metadata,
      raw
    });

    rebuild();
  }
  function makeSortable() {
    $(".sortable")
      .sortable({
        containment: "parent",
        cancel: ".banner",
        stop: function (event, ui) {
          console.log("stopping");
          let uid = $(ui.item).attr("raw");
          let newPrio = $(ui.item).prevAll(".banner:first").text();
          newPrio == "no priority" ? (newPrio = null) : (newPrio = newPrio);
          for (let i = 0; i < mainArr.length; i++) {
            if (mainArr[i].raw == uid) {
              mainArr[i].priority = newPrio;
            }
          }
          rebuild();
        },
        update: function () {
          var tempItems = [];
          $(".sortable")
            .children()
            .each(function (i) {
              let raw = $(this).attr("raw");
              mainArr.map((item) => {
                console.log(item.raw);
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
  function editItem() {
    if (selected) {
      let index = mainArr.find((e) => {
        return e.metadata.uid == selected;
      });
      let text = index.raw;
      if (text.includes("uid:")) {
        text = text.substring(0, text.indexOf("uid:"));
      }
      $("#todotext").val(text);
      mainArr = mainArr.filter((item) => {
        return item.metadata.uid != selected;
      });
      rebuild();
    }
  }
  // click event binders
  // $("#priority, #todotext, #project, #context, #sprint, #poc").on(
  //   "keydown",
  //   function (e) {
  //     if (e.key === "Enter") {
  //       addNew();
  //     }
  //   }
  // );
  $("#todotext").on("keydown", function (e) {
    if (e.key === "Enter") {
      let uid = uniqueid();
      let phrase = $(this).val() + ` uid:${uid}`;
      console.log(phrase);
      window.api.send("toParse", { data: phrase });
    }
  });
  window.api.receive("parsed", function (data) {
    addNewLine(data[0]);
    $("#todotext").val("");
  });
  $(document).on("click", ".check", function () {
    console.log(mainArr);
    let isChecked = $(this).is(":checked");
    if (isChecked) {
      let connected = $(this).attr("connected");
      for (let i = 0; i < mainArr.length; i++) {
        if (mainArr[i].metadata.uid == connected) {
          mainArr[i].complete = true;
          rebuild();
        }
      }
    } else {
      $(this).closest("div").attr("checked", "false");
      let connected = $(this).attr("connected");
      for (let i = 0; i < mainArr.length; i++) {
        if (mainArr[i].metadata.uid == connected) {
          mainArr[i].complete = false;
          rebuild();
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
      window.api.send("saveFile", { data: mainArr });
    }
    if (keys[17] && keys[69]) {
      editItem();
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
        console.log(text);
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
    console.log(uid);
    console.log($(this).closest(".list-item"));
    $(this).closest(".list-item").hide();
    mainArr = mainArr.filter((item) => {
      return item.metadata.uid != uid;
    });
    rebuild();
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
