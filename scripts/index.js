$(function () {
  let obj = [];
  window.api.send("load", true);
  window.api.receive("loadedData", function (data) {
    obj = data;
    console.log(data);
    data.map((item) => {
      let listItem = `<div connected=${item.key} class="list-item"><input connected=${item.key} class="check" type="checkbox"/>${item.key}</div>`;
      $(".list-container").append(listItem);
      $(`input[connected=${item.key}]`).prop("checked", item.checked);
    });
  });
  console.log("jquery loaded");
  $(".sortable").sortable({
    update: function () {
      var tempItems = [];

      $(".sortable")
        .children()
        .each(function (i) {
          let key = $(this).attr("connected");

          let checked = $(this).find("input:first").is(":checked");
          tempItems.push({ key, checked });
        });
      updateSortOrderJS(tempItems);
    }
  });
  function updateSortOrderJS(param) {
    console.log(param);
    obj = param;
    console.log(obj);
  }

  $(".add-input").on("keydown", function (e) {
    let value = $(".add-input").val();
    if (e.key === "Enter") {
      if (value != "") {
        let listItem = `<div connected=${value} checked="false" class="list-item"><input connected=${value} class="check" type="checkbox"/>${value}</div>`;
        $(".list-container").append(listItem);
        $(".add-input").val("");
        obj.push({ key: value, checked: false });
      }
    }
  });
  $(document).on("click", ".check", function () {
    let isChecked = $(this).is(":checked");
    if (isChecked) {
      $(this).closest(".list-item").css({
        textDecoration: "line-through"
      });
      let connected = $(this).attr("connected");
      for (let i = 0; i < obj.length; i++) {
        if (obj[i].key == connected) {
          obj[i].checked = true;
        }
      }
    } else {
      $(this).closest(".list-item").css({
        textDecoration: "none"
      });
      $(this).closest(".list-item").attr("checked", "false");
      let connected = $(this).attr("connected");
      for (let i = 0; i < obj.length; i++) {
        if (obj[i].key == connected) {
          obj[i].checked = false;
        }
      }
    }
  });
  setInterval(() => {
    if (obj.length > 0) {
      window.api.send("saveFile", { data: obj });
    }
  }, 1800000);
  let keys = {};
  $(document).keydown(function (e) {
    if (e.which === 17 || e.which === 83) {
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
});
