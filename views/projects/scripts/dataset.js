$(document).ready(function () {
  var metaTemplate;
  var rowsTemplate;
  var profileTemplate;
  var pageTemplate;
  var featureTemplate;

  var t1 = function () {
    return $.get("/javascripts/templates/data/meta.hbs", function (t) {
      metaTemplate = Handlebars.compile(t);
    });
  };
  var t2 = function () {
    return $.get("/javascripts/templates/data/rows.hbs", function (t) {
      rowsTemplate = Handlebars.compile(t);
    });
  };
  var t3 = function () {
    return $.get(
      "/javascripts/templates/fragments/pagination.hbs",
      function (t) {
        pageTemplate = Handlebars.compile(t);
      }
    );
  };
  var t4 = function () {
    return $.get("/javascripts/templates/data/profile.hbs", function (t) {
      profileTemplate = Handlebars.compile(t);
    });
  };

  $.when(t1(), t2(), t3(), t4()).done(function () {
    findMetaWithData();
  });

  var hasMoreData = true;
  var searchOption = {
    currentPage: 1,
    perPage: 50,
  };
  var totalRows = 0;

  var dataRows;
  function findMetaWithData(isForced) {
    if (!$(".loading").hasClass("active")) {
      $(".loading").addClass("active");
    }

    $(".data-filter-box").hide();

    if (!dataRows || isForced) {
      $.getJSON("/datasets/" + datasestId, searchOption, function (d) {
        var metaHtml = metaTemplate(d.dataset.metas);
        $("#meta-wrap").html(metaHtml);

        if (d.results && d.results.rows && d.results.rows.length) {
          dataRows = d.results.rows;
          var rowsHtml = rowsTemplate(d.results.rows);
          $("#rows").html(rowsHtml);
        }

        totalRows = d.results.count.cnt;

        var pageInfo = {
          currentPage: searchOption.currentPage,
          total: Math.ceil(totalRows / searchOption.perPage),
          pages: [],
        };

        for (
          var i = pageInfo.currentPage - 3;
          i <= pageInfo.currentPage + 3;
          ++i
        ) {
          if (i > 0) {
            pageInfo.pages.push(i);
          }
        }

        var paginationHtml = pageTemplate(pageInfo);
        $("#rows-pagination").html(paginationHtml);

        $(".loading").removeClass("active");

        renderProfileResult();
      });
    } else {
      $(".loading").removeClass("active");
    }
  }

  var profileResult;
  function renderProfileResult() {
    if (!profileResult) {
      $.getJSON("/datasets/" + datasestId + "/profile", function (d) {
        if (d && d.status == "success") {
          profileResult = d.results;

          var profileHtml = profileTemplate(profileResult);
          $("#profile-wrap").html(profileHtml);

          renderProfileChart(profileResult);
        }
      });
    }
  }

  var tempSortCol;
  var tempSortDir;

  $(document).on("click", ".filter-btn", function (e) {
    e.preventDefault();
    var selectedCol = $(this).data("col");
    var targetCol = ".col-header[data-col='" + selectedCol + "']";

    tempSortCol = selectedCol;

    $(".data-filter-box").detach().appendTo(targetCol);
    $(".data-filter-box").show();
  });

  $(document).on("click", ".sort-btn", function (e) {
    $(".sort-btn").removeClass("active");
    $(this).addClass("active");

    tempSortDir = $(this).data("direction");
  });

  $(document).on("click", ".apply-filter-btn", function (e) {
    if (tempSortCol && tempSortDir) {
      searchOption.sortCol = tempSortCol;
      searchOption.sortDir = tempSortDir;

      searchOption.currentPage = 1;
      findMetaWithData(true);
    }
  });

  $(document).on("click", ".cancel-filter-btn", function (e) {
    tempSortCol = null;
    tempSortDir = null;

    delete searchOption.sortCol;
    delete searchOption.sortDir;
  });

  $(document).on("click", ".page-num", function (e) {
    e.preventDefault();
    var page = $(this).data("page");
    searchOption.currentPage = page;
    findMetaWithData(true);
  });

  $(document).on("click", ".cancel-filter-btn", function (e) {
    $(".data-filter-box").hide();
  });

  function renderProfileChart(results) {
    for (var i = 1; i < results.length; i++) {
      var result = results[i];
      var profileColId = "profile-" + result.columnName;

      if (result.rowCnt == result.uniqueCnt) {
        var uniqueHtml = [];
        uniqueHtml.push("<div class='profile-value'>");
        uniqueHtml.push(
          "<h4 class='center-align'>" + result.uniqueCnt + "</h4>"
        );
        uniqueHtml.push(
          "<div class='center-align'><small>Unique values</small></div>"
        );
        uniqueHtml.push("</div>");

        $("#" + profileColId).html(uniqueHtml.join(""));
      } else if (result.vfs && result.vfs.length) {
        renderBarChart(profileColId, result.vfs);
      } else if (result.columnType == "DECIMAL") {
        var numberHtml = [];
        numberHtml.push("<div class='profile-value'>");
        numberHtml.push(" <div>");
        numberHtml.push(" <span>Max: </span>");
        numberHtml.push(" <span class='value'>");
        numberHtml.push(
          result.numMaxVal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })
        );
        numberHtml.push(" </span>");
        numberHtml.push(" </div>");

        numberHtml.push(" <div>");
        numberHtml.push(" <span>Min: </span>");
        numberHtml.push(" <span class='value'>");
        numberHtml.push(
          result.numMinVal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })
        );
        numberHtml.push(" </span>");
        numberHtml.push(" </div>");

        numberHtml.push(" <div>");
        numberHtml.push(" <span>Mean</span>");
        numberHtml.push(" <span class='value'>");
        numberHtml.push(
          result.numMeanVal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })
        );
        numberHtml.push(" </span>");
        numberHtml.push(" </div>");

        numberHtml.push(" <div>");
        numberHtml.push(" <span>Median</span>");
        numberHtml.push(" <span class='value'>");
        numberHtml.push(
          result.numMedianVal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })
        );
        numberHtml.push(" </span>");
        numberHtml.push(" </div>");
        numberHtml.push("</div>");

        $("#" + profileColId).html(numberHtml.join(""));
      } else {
        var stringHtml = [];
        stringHtml.push("<div class='profile-value'>");
        stringHtml.push(" <div>");
        stringHtml.push(" <span>Distinct: </span>");
        stringHtml.push(" <span class='value'>");
        stringHtml.push(result.distinctCnt.toLocaleString());
        stringHtml.push(" </span>");
        stringHtml.push(" </div>");

        stringHtml.push(" <div>");
        stringHtml.push(" <span>Duplicate: </span>");
        stringHtml.push(" <span class='value'>");
        stringHtml.push(result.duplicateCnt.toLocaleString());
        stringHtml.push(" </span>");
        stringHtml.push(" </div>");
        numberHtml.push("</div>");

        $("#" + profileColId).html(stringHtml.join(""));
      }
    }
  }

  function renderBarChart(chartId, items) {
    am4core.ready(function () {
      am4core.useTheme(am4themes_animated);
      // Themes end
      // Create chart instance

      var chart = am4core.create(chartId, am4charts.XYChart);
      chart.data = items;

      var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
      categoryAxis.autoGridCount = true;
      categoryAxis.dataFields.category = "columnGroupVal";
      categoryAxis.renderer.minGridDistance = 80;

      // category axis label 길이 제한
      var label = categoryAxis.renderer.labels.template;
      label.fill = am4core.color("#fff");
      label.dx = 0;
      label.fontWeight = "200";
      label.truncate = true;
      label.maxWidth = 80;
      label.fontSize = 10;

      //- categoryAxis.renderer.labels.template.adapter.add("dy", function(dy, target) {
      //-   if (target.dataItem && target.dataItem.index & 2 == 2) {
      //-     return dy + 25;
      //-   }
      //-   return dy;
      //- });

      var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.renderer.line.disabled = true; //disables axis line
      valueAxis.renderer.labels.template.disabled = true; //disables labels
      valueAxis.renderer.grid.template.disabled = true; //disables grid

      // Create series
      var series = chart.series.push(new am4charts.ColumnSeries());
      series.dataFields.valueY = "columnGroupCount";
      series.dataFields.categoryX = "columnGroupVal";
      series.name = "Count";
      series.columns.template.fillOpacity = 0.8;
      series.columns.template.fill = am4core.color("#48dac5");
      series.columns.template.tooltipText = "{categoryX}: [bold]{valueY}[/]";

      series.tooltip.getFillFromObject = false;
      series.tooltip.background.fill = am4core.color("#fff");
      series.tooltip.fontWeight = "200";
      series.tooltip.label.fill = am4core.color("#000");
      series.tooltip.label.fontSize = 10;

      var columnTemplate = series.columns.template;
      columnTemplate.strokeWidth = 1;
      columnTemplate.strokeOpacity = 0.3;
    });
  }
});