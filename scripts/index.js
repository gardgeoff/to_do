$(function () {
  // initialize empty array to hold "to do list" data
  let obj = [];
  // send signal to main and retrieve the locally saved data
  // assign data to obj array and rebuild() to generate the screen
  window.api.send("load", true);
  window.api.receive("loadedData", function (data) {
    obj = data;
    rebuild();
  });

  function rebuild() {
    $(".list-container").empty();
    let banners = ["no_priority"];
    let items = [];
    obj.map((item) => {
      if (item.priority) {
        !banners.includes(item.priority)
          ? banners.push(`${item.priority}`)
          : null;
      }
      items.push(item);
    });

    items.sort((x, y) => {
      return x.checked - y.checked;
    });
    items.sort((x, y) => {
      return x.priority < y.priority ? -1 : x.priority > y.priority ? 1 : 0;
    });
    // append the priority banners

    // makeSortable() causes lists to be drag and drop
    makeSortable();
    // append the to do items to their respective banners
    banners.push("");
    items.map((item) => {
      let hasPrio =
        item.priority == undefined
          ? "group-no_priority"
          : "group-" + item.priority;
      $(".list-container").append(
        `<div
        uid=${item.created} 
        class="list-item ${hasPrio}"
        key=${item.priority}
        >
          <input connected="${item.created}" class="check" type="checkbox"/>
          <span class="line-through">
            ${item.priority || ""} ${item.date} ${item.text} ${
          item.project || ""
        } ${item.context || ""} ${item.due || ""}
          </span>
          <button class="edit-item btn btn-primary">edit</button>
          <button class="del-item btn btn-danger">delete</button>
        </div>`
      );
      $(".del-item").css("visibility", "hidden");
      $(".edit-item").css("visibility", "hidden");
      if (item.checked) {
        $(`input[connected="${item.created}"]`)
          .prop("checked", true)
          .closest(".list-item")
          .find(".line-through")
          .css("textDecoration", "line-through");
      }
    });
    banners.map((item) => {
      let insert = $(".group-" + item).first();
      let string = `<div class="banner banner-${item}">${item}</div>`;
      $(string).insertBefore(insert);
    });
  }

  // grab inputs and create a new to do item
  function addNew() {
    let priority = $("#priority").val().trim();
    let todo = $("#todotext").val().trim();
    let due = $("#due").val() == "" ? "" : `due:${$("#due").val()}`;
    let project = $("#project").val().trim();
    let context = $("#context").val().trim();
    let created = Date.now();
    let date = moment(created).format("YYYY-MM-DD");
    let prioNoParenthesis;

    // test if priority exists and is A-Z
    if (priority && /^[a-zA-Z]+$/.test(priority)) {
      let tempPrio = priority.match(/^[a-zA-Z]+$/)[0];
      tempPrio = tempPrio.toUpperCase();
      prioNoParenthesis = tempPrio;
      tempPrio = "(" + tempPrio + ")";
      priority = tempPrio;
    }
    if (project && !project.startsWith("@")) {
      project = "@" + project;
    }
    if (context && !context.startsWith("+")) {
      context = "+" + context;
    }

    if (todo) {
      let totalString =
        `${priority} ${date} ${todo} ${project} ${context} ${due}`.trim();
      obj.push({
        key: totalString,
        text: todo,
        date,
        priority: prioNoParenthesis,
        project,
        created,
        context,
        due,
        checked: false
      });
      rebuild();
      $("#priority, #todotext, #project, #context").val("");
    }
  }
  function makeSortable() {
    $(".sortable")
      .sortable({
        contain: "parent",

        stop: function (event, ui) {
          let uid = $(ui.item).attr("uid");
          let newPrio = $(ui.item).prevAll(".banner").text();
          console.log(uid);
          console.log(newPrio);
          for (let i = 0; i < obj.length; i++) {
            if (obj[i].created == uid) {
              obj[i].priority = newPrio;
            }
          }
          rebuild();
        },
        update: function () {
          var tempItems = [];
          $(".sortable")
            .children()
            .each(function (i) {
              let connection = parseInt($(this).attr("uid"));
              obj.map((item) => {
                if (item.created == connection) {
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
    obj = param;
  }
  // click event binders
  $("#priority, #todotext, #project, #context").on("keydown", function (e) {
    if (e.key === "Enter") {
      addNew();
    }
  });

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
      for (let i = 0; i < obj.length; i++) {
        if (obj[i].created == connected) {
          obj[i].checked = true;
          rebuild();
        }
      }
    } else {
      $(this).closest(".list-item").find(".line-through").css({
        textDecoration: "none"
      });
      $(this).closest("div").attr("checked", "false");
      let connected = $(this).attr("connected");
      for (let i = 0; i < obj.length; i++) {
        if (obj[i].created == connected) {
          obj[i].checked = false;
          rebuild();
        }
      }
    }
    window.api.send("saveFile", { data: obj });
  });
  let keys = {};
  $(document).on("keydown", function (e) {
    if (e.keyCode === 17 || e.which === 83) {
      keys[e.which] = true;
    }
    if (keys[17] && keys[83]) {
      window.api.send("saveFile", { data: obj });
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
  $(document).on("click", ".del-item", function () {
    let uid = $(this).closest(".list-item").attr("uid");
    $(this).closest(".list-item").hide();
    obj = obj.filter((item) => {
      return item.created != uid;
    });
    rebuild();
  });
  $(document).on("click", ".edit-item", function () {
    let uid = $(this).closest(".list-item").attr("uid");
    let entry = obj.find((element) => element.created == uid);
  });
  $(document)
    .on("mouseover", ".list-item", function () {
      $(this).find(".del-item:first").css("visibility", "visible");
      $(this).find(".edit-item:first").css("visibility", "visible");
    })
    .on("mouseout", ".list-item", function () {
      $(this).find(".del-item:first").css("visibility", "hidden");
      $(this).find(".edit-item:first").css("visibility", "hidden");
    });
  // 30 minute auto save interval
  setInterval(() => {
    if (obj.length > 0) {
      window.api.send("saveFile", { data: obj });
    }
  }, 1800000);
});
