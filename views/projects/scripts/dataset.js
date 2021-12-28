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

  var dataRows;
  var totalRows = 0;

  $.when(t1(), t2(), t3(), t4()).done(function () {
    findMetaWithData();
  });

  var timer = setInterval(function () {
    if (!dataRows) {
      findMetaWithData();
    } else {
      clearInterval(timer);
    }
  }, 2000);

  var hasMoreData = true;
  var searchOption = {
    currentPage: 1,
    perPage: 50,
  };

  function findMetaWithData(isForced) {
    if (!$(".loading").hasClass("active")) {
      $(".loading").addClass("active");
    }

    $(".data-filter-box").hide();

    if (!dataRows || isForced) {
      $.getJSON("/datasets/" + datasetId, searchOption, function (d) {
        if (d && d.dataset) {
          var metaHtml = metaTemplate(d.dataset.metas);
          $("#meta-wrap").html(metaHtml);

          if (d.results && d.results.rows && d.results.rows.length) {
            dataRows = d.results.rows;
            var rowsHtml = rowsTemplate({ rows: d.results.rows });
            $("#rows").html(rowsHtml);

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

            if (task && task == "imputation") {
              var dataIds = [];
              for (var row of dataRows) {
                dataIds.push(row[0]);
              }

              $.ajax({
                url: "/datasets/originByProject",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                  projectId: projectId,
                  dataIds: dataIds,
                }),
                success: function (d) {
                  if (d && d.rows) {
                    var dataLength = d.rows.length;
                    for (var i = 0; i < dataLength; i++) {
                      var origin = dataRows[i];
                      var imputed = d.rows[i];

                      for (var j = 0; j < origin.length; j++) {
                        if (origin[j] != imputed[j]) {
                          $(
                            ".data-row[data-id='" +
                              origin[0] +
                              "'] td:nth-child(" +
                              j +
                              ")"
                          ).addClass("teal");
                        }
                      }
                    }
                  }
                },
                error: function (err) {
                  console.log(err);
                },
              });
            }
          }
        }
      });
    } else {
      $(".loading").removeClass("active");
    }
  }

  var profileResult;
  function renderProfileResult() {
    if (!profileResult) {
      $.getJSON("/datasets/" + datasetId + "/profile", function (d) {
        if (d && d.status == "SUCCESS") {
          profileResult = d.results;
          console.log(profileResult);

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

  var importanceResult = null;
  $(document).on("click", ".importance-btn", function (e) {
    $.getJSON("/datasets/" + datasetId + "/importance", function (result) {
      if (result && result.metas) {
        importanceResult = result.metas;

        var metaMap = {};
        var chartData = [];
        for (var r of importanceResult) {
          metaMap[r.id] = { name: r.name, koName: r.koName };
          chartData.push({
            base: r.name,
            target: r.name,
            value: 0,
          });
        }

        for (var r of importanceResult) {
          if (r.targets && r.targets.length) {
            for (var target of r.targets) {
              chartData.push({
                base: metaMap[r.id].name,
                target: metaMap[target.featureId].name,
                value: Math.ceil(target.importance * 100),
              });
            }
          }
        }

        $("#importance-result").html("");
        renderImportanceChart("importance-result", chartData);
      }
    });
  });

  function renderProfileChart(results) {
    for (var i = 0; i < results.length; i++) {
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
        stringHtml.push("</div>");

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

  function renderImportanceChart(chartId, data) {
    am4core.useTheme(am4themes_animated);
    // Themes end

    var chart = am4core.create(chartId, am4charts.XYChart);
    chart.maskBullets = false;
    chart.data = data;

    var xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    var yAxis = chart.yAxes.push(new am4charts.CategoryAxis());

    xAxis.dataFields.category = "base";
    yAxis.dataFields.category = "target";

    xAxis.renderer.grid.template.disabled = true;
    xAxis.renderer.minGridDistance = 40;
    xAxis.renderer.labels.template.rotation = 30;

    yAxis.renderer.grid.template.disabled = true;
    yAxis.renderer.inversed = true;
    yAxis.renderer.minGridDistance = 30;

    xAxis.renderer.labels.template.fill = am4core.color("#fff");

    yAxis.renderer.labels.template.fill = am4core.color("#fff");

    var series = chart.series.push(new am4charts.ColumnSeries());
    series.dataFields.categoryX = "base";
    series.dataFields.categoryY = "target";
    series.dataFields.value = "value";
    series.sequencedInterpolation = true;
    series.defaultState.transitionDuration = 3000;

    var bgColor = new am4core.InterfaceColorSet().getFor("background");

    var columnTemplate = series.columns.template;
    columnTemplate.strokeWidth = 1;
    columnTemplate.strokeOpacity = 0.2;
    columnTemplate.stroke = bgColor;
    columnTemplate.tooltipText =
      "{base}, {target}: {value.workingValue.formatNumber('#.')}%";
    columnTemplate.width = am4core.percent(100);
    columnTemplate.height = am4core.percent(100);

    series.heatRules.push({
      target: columnTemplate,
      property: "fill",
      min: am4core.color("#fff"),
      max: am4core.color("#4db6ac"),
    });

    // heat legend
    var heatLegend = chart.bottomAxesContainer.createChild(
      am4charts.HeatLegend
    );
    heatLegend.width = am4core.percent(100);
    heatLegend.series = series;
    heatLegend.valueAxis.renderer.labels.template.fontSize = 9;
    heatLegend.valueAxis.renderer.minGridDistance = 30;

    // heat legend behavior
    series.columns.template.events.on("over", function (event) {
      handleHover(event.target);
    });

    series.columns.template.events.on("hit", function (event) {
      handleHover(event.target);
    });

    function handleHover(column) {
      if (!isNaN(column.dataItem.value)) {
        heatLegend.valueAxis.showTooltipAt(column.dataItem.value);
      } else {
        heatLegend.valueAxis.hideTooltip();
      }
    }

    series.columns.template.events.on("out", function (event) {
      heatLegend.valueAxis.hideTooltip();
    });

    $("#importance-modal").modal();
    $("#importance-modal").modal("open");
  }
});
