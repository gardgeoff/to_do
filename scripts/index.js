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
    let banners = [];
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
      return x.priority < y.priority
        ? -1
        : x.priority > y.priority
        ? 1
        : !y.priority
        ? -1
        : 0;
    });

    console.log(items);
    // append the priority banners

    // makeSortable() causes lists to be drag and drop
    makeSortable();
    // append the to do items to their respective banners

    items.map((item) => {
      let handleDue = item.due === "" ? "" : `due:${item.due}`;
      let handlePoc = item.poc == "" ? "" : `poc:${item.poc}`;
      let handleSprint = item.sprint == "" ? "" : `sprint:${item.sprint}`;

      let hasPrio =
        item.priority == undefined
          ? "group-no_priority"
          : "group-" + item.priority;
      $(".list-container").append(
        `<div
        uid=${item.created} 
        class="list-item ${hasPrio}"
        key=${item.priority}
        text='${item.text}'
        due=${item.due || ""}
        >
          <input connected="${item.created}" class="check" type="checkbox"/>
          <span class="line-through"> ${item.priority || ""} ${item.date} ${
          item.text
        } ${item.project || ""} ${
          item.context || ""
        } ${handlePoc} ${handleSprint} ${handleDue}
          </span>
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

    banners.push("no_priority");
    banners.map((item) => {
      let insert = $(".group-" + item).first();
      let string = `<div class="banner banner-${item}">${item}</div>`;
      $(string).insertBefore(insert);
    });
    checkDates();
  }
  function checkDates() {
    $(".list-item").each(function (i, obj) {
      let dueDate = $(obj).attr("due");
      let now = moment(Date.now()).format("YYYY/MM/DD");
      let diffInDays = moment(dueDate).diff(now, "days");
      console.log(diffInDays);
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
    if (project && !project.startsWith("+")) {
      project = "+" + project;
    }
    if (context && !context.startsWith("@")) {
      context = "@" + context;
    }
    if (todo) {
      obj.push({
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
  $(document).keydown(function(e){
    delete todo_item[e.which.priority.prop.rebuild];
    console.log(todo_item);
    async function(){
      await rebuild();
    }
  })
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
    obj = obj.filter((item) => {
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
    if (obj.length > 0) {
      window.api.send("saveFile", { data: obj });
    }
  }, 1800000);
});
