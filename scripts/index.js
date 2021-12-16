$(function () {
  // initialize empty array to hold to do list data
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
    banners.sort();
    // append the priority banners
    banners.map((item) => {
      $(".list-container").append(
        `
        <div class="sortable" id=${item}>
          <div class="banner banner-${item}">${item}</div>
        </div>`
      );
    });
    // makeSortable() causes lists to be drag and drop
    makeSortable();
    // append the to do items to their respective banners
    items.map((item) => {
      $("#" + item.priority).append(
        `<div
        uid=${item.created} 
        class="list-item"
        key=${item.priority}
        >
          <input connected="${item.created}" class="check" type="checkbox"/><span class="line-through">${item.key}</span>
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
  }
  // console.log(moment(Date.now()).format("YYYY/MM/DD"));
  // grab inputs and create a new to do item
  function addNew() {
    let priority = $("#priority").val().trim();
    let todo = $("#todotext").val().trim();
    let project = $("#project").val().trim();
    let context = $("#context").val().trim();
    let created = Date.now();
    let prioNoParenthesis;
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
      let totalString = `${priority} ${todo} ${project} ${context}`.trim();
      obj.push({
        key: totalString,
        priority: prioNoParenthesis,
        project,
        created,
        context,
        checked: false
      });
      rebuild();
      $("#priority, #todotext, #project, #context").val("");
    }
  }
  function makeSortable() {
    $(".sortable").sortable({
      cancel: ".banner",
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
    });
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
      console.log("saving");
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
