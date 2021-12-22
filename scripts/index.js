$(function () {
  // initialize empty array to hold "to do list" data
  let mainArr = [];
  // send signal to main and retrieve the locally saved data
  // assign data to mainArr array and rebuild() to generate the screen
  window.api.send("load", true);
  window.api.receive("loadedData", function (data) {
    mainArr = data;
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
    console.log(listItems);
    console.log(banners);
    mainArr.map((item) => {
      if (item.priority && item.priority.length) {
        !banners.includes(item.priority)
          ? banners.push(`${item.priority}`)
          : null;
      }
      listItems.push(item);
    });
    listItems.sort((x, y) => {
      return x.checked - y.checked;
    });
    // sort priority alphabetically
    // sort no priority last
    listItems.sort((x, y) => {
      return x.priority < y.priority
        ? -1
        : x.priority > y.priority
        ? 1
        : !y.priority
        ? -1
        : 0;
    });
    console.log(listItems);
    console.log(banners);
    // makeSortable() causes lists to be drag and drop
    makeSortable();
    listItems.map((item) => {
      // handle empty strings
      let handleDue = !item.due ? "" : `due:${item.due}`;
      let handlePoc = !item.poc ? "" : `poc:${item.poc}`;
      let handleSprint = !item.sprint ? "" : `sprint:${item.sprint}`;
      let handleContext = !item.context
        ? undefined
        : !item.context.includes("@")
        ? "@" + item.context
        : item.context;
      let handleProject = !item.project
        ? undefined
        : !item.project.includes("+")
        ? "+" + item.project
        : item.project;
      let handlePrio = !item.priority ? undefined : "(" + item.priority + ")";
      let hasPrio = !item.priority
        ? "group-no_priority"
        : "group-" + item.priority;
      let totalString = `${handlePrio || ""} ${item.date} ${item.text} ${
        handleProject || ""
      } ${handleContext || ""} ${handleDue} ${handlePoc} ${handleSprint}`;
      $(".list-container").append(
        `<div
          uid=${item.created} 
          class="list-item ${hasPrio}")
          key=${item.priority}
          text='${item.text}'
          due=${item.due || ""}
        >
          <input connected="${item.created}" class="check" type="checkbox"/>
          <span class="line-through">${totalString}</span>
          <button class="del-item btn btn-danger">delete</button>
        </div>`
      );
      $(".del-item").css("visibility", "hidden");
      if (item.checked) {
        $(`input[connected="${item.created}"]`)
          .prop("checked", true)
          .closest(".list-item")
          .find(".line-through")
          .css("textDecoration", "line-through");
      }
    });

    !banners.includes("no_priority") ? banners.push("no_priority") : null;
    banners.map((item) => {
      let insert = $(".group-" + item).first();
      let string = `<div class="banner banner-${item}">${item}</div>`;
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
        $(this).css({ color: "red" });
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
  function makeSortable() {
    $(".sortable")
      .sortable({
        containment: "parent",
        cancel: ".banner",
        stop: function (event, ui) {
          let uid = $(ui.item).attr("uid");
          let newPrio = $(ui.item).prevAll(".banner:first").text();
          console.log(newPrio);
          newPrio == "no_priority"
            ? (newPrio = undefined)
            : (newPrio = newPrio);
          for (let i = 0; i < mainArr.length; i++) {
            if (mainArr[i].created == uid) {
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
              let connection = $(this).attr("uid");
              mainArr.map((item) => {
                if (item.created == connection) {
                  tempItems.push(item);
                }
              });
            });
          console.log(tempItems);
          updateSortOrderJS(tempItems);
        }
      })
      .disableSelection();
  }
  function updateSortOrderJS(param) {
    mainArr = param;
  }
  // click event binders
  $("#priority, #todotext, #project, #context, #sprint, #poc").on(
    "keydown",
    function (e) {
      if (e.key === "Enter") {
        addNew();
      }
    }
  );
  $("#submit").on("click", function () {
    addNew();
  });
  $(document).on("click", ".check", function () {
    let isChecked = $(this).is(":checked");
    if (isChecked) {
      $(this).closest(".list-item").find(".line-through").css({
        textDecoration: "line-through"
      });
      let connected = $(this).attr("connected");
      for (let i = 0; i < mainArr.length; i++) {
        if (mainArr[i].created == connected) {
          mainArr[i].checked = true;
          rebuild();
        }
      }
    } else {
      $(this).closest(".list-item").find(".line-through").css({
        textDecoration: "none"
      });
      $(this).closest("div").attr("checked", "false");
      let connected = $(this).attr("connected");
      for (let i = 0; i < mainArr.length; i++) {
        if (mainArr[i].created == connected) {
          mainArr[i].checked = false;
          rebuild();
        }
      }
    }
    window.api.send("saveFile", { data: mainArr });
  });
  let keys = {};
  $(document).on("keydown", function (e) {
    if (e.keyCode === 17 || e.which === 83) {
      keys[e.which] = true;
    }
    if (keys[17] && keys[83]) {
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
  $(document).on("click", ".list-item", function (e) {
    if (this === e.target) {
      let xPos = e.pageX;
      let yPos = e.pageY;
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
    }
  });
  $(document).on("click", ".del-item", function () {
    let uid = $(this).closest(".list-item").attr("uid");
    $(this).closest(".list-item").hide();
    mainArr = mainArr.filter((item) => {
      return item.created != uid;
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
