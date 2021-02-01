//convert fraction to percentage string
init();

function init() {
  //get matchID from URL
  const queryString = window.location.search;

  const urlParams = new URLSearchParams(queryString);
  let matchID = urlParams.get("matchID");
  console.log(matchID);
  var socket = io.connect(window.location.hostname);
  const pointConvert = {
    0: "0",
    1: "15",
    2: "30",
    3: "40",
    4: "Adv",
  };

  socket.on("/display/" + matchID, function (msg) {
    drawChart(msg);
  });
}

function toPercentage(arg1, arg2) {
  return parseFloat((100 * arg1) / (arg1 + arg2)).toFixed(0) + "%";
}
//draw chart

function drawChart(M1) {
  //create function to insert text in mindle of Doughnut Chart
  let homeColor = "rgba(54,162,235,1)";
  let awayColor = "yellow";
  Chart.pluginService.register({
    beforeDraw: function (chart) {
      if (chart.config.options.elements.center) {
        // Get ctx from string
        var ctx = chart.chart.ctx;

        // Get options from the center object in options
        var centerConfig = chart.config.options.elements.center;
        var fontStyle = centerConfig.fontStyle || "Arial";
        var txt = centerConfig.text1;
        var txt2 = centerConfig.text2;
        var color = centerConfig.color1 || "#000";
        var color2 = centerConfig.color2 || "#000";
        var maxFontSize = centerConfig.maxFontSize || 75;
        var sidePadding = centerConfig.sidePadding || 20;
        var sidePaddingCalculated =
          (sidePadding / 100) * (chart.innerRadius * 2);
        // Start with a base font of 30px
        ctx.font = "30px " + fontStyle;

        // Get the width of the string and also the width of the element minus 10 to give it 5px side padding
        var stringWidth = ctx.measureText(txt).width;
        var elementWidth = chart.innerRadius * 2 - sidePaddingCalculated;

        // Find out how much the font can grow in width.
        var widthRatio = elementWidth / stringWidth;
        var newFontSize = Math.floor(30 * widthRatio);
        var elementHeight = chart.innerRadius * 2;

        // Pick a new font size so it will not be larger than the height of label.
        var fontSizeToUse = Math.min(newFontSize, elementHeight, maxFontSize);
        var minFontSize = centerConfig.minFontSize;
        var lineHeight = centerConfig.lineHeight || 25;
        var wrapText = false;

        if (minFontSize === undefined) {
          minFontSize = 20;
        }

        if (minFontSize && fontSizeToUse < minFontSize) {
          fontSizeToUse = minFontSize;
          wrapText = true;
        }

        // Set font settings to draw it correctly.
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        var centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
        var centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
        ctx.font = fontSizeToUse + "px " + fontStyle;
        ctx.fillStyle = color;

        if (!wrapText) {
          ctx.fillText(txt, centerX, centerY - lineHeight / 2);
          ctx.fillStyle = color2;
          ctx.fillText(txt2, centerX, centerY + lineHeight / 2);
          return;
        }

        var words = txt.split(" ");
        var line = "";
        var lines = [];

        // Break words up into multiple lines if necessary
        for (var n = 0; n < words.length; n++) {
          var testLine = line + words[n] + " ";
          var metrics = ctx.measureText(testLine);
          var testWidth = metrics.width;
          if (testWidth > elementWidth && n > 0) {
            lines.push(line);
            line = words[n] + " ";
          } else {
            line = testLine;
          }
        }

        // Move the center up depending on line height and number of lines
        centerY -= (lines.length / 2) * lineHeight;

        for (var n = 0; n < lines.length; n++) {
          ctx.fillText(lines[n], centerX, centerY);
          centerY += lineHeight;
        }
        //Draw text in center
        ctx.fillText(line, centerX, centerY);
      }
    },
  });

  var ctx0 = document.getElementById("myChart");
  var myChart = new Chart(ctx0, {
    type: "horizontalBar",
    data: {
      labels: [
        "Số điểm thắng",
        "Ace",
        "Lỗi kép",
        "Ăn điểm trực tiếp",
        "Tự đánh lỗi",
        "Ghi điểm trên lưới",
        "Mất điểm trên lưới",
      ],
      datasets: [
        {
          label: M1.result[0].gameScore.home + " - " + M1.homePlayer,
          data: [
            M1.result[0].stats.home.totalPointWon,
            M1.result[0].stats.home.ACE,
            M1.result[0].stats.home.DF,
            M1.result[0].stats.home.winner,
            M1.result[0].stats.home.UFE,
            M1.result[0].stats.home.netWin,
            M1.result[0].stats.home.netLost,
          ],
          backgroundColor: homeColor,

          borderColor: "rgba(54, 162, 235,1)",

          borderWidth: 1,
        },
        {
          label: M1.result[0].gameScore.away + " - " + M1.awayPlayer,
          data: [
            M1.result[0].stats.away.totalPointWon,
            M1.result[0].stats.away.ACE,
            M1.result[0].stats.away.DF,
            M1.result[0].stats.away.winner,
            M1.result[0].stats.away.UFE,
            M1.result[0].stats.away.netWin,
            M1.result[0].stats.away.netLost,
          ],
          backgroundColor: awayColor,
          borderColor: "rgba(255, 205, 86, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      datalabels: {
        color: "#36A2EB",
      },
      legend: {
        display: true,
        labels: {
          fontColor: "rgb(255, 99, 132)",
        },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
      },
    },
  });

  var ctx1 = document.getElementById("serveChart");
  var serveChart = new Chart(ctx1, {
    type: "doughnut",
    data: {
      labels: ["1st Serve", "2nd Serve"],
      datasets: [
        {
          label: M1.homePlayer,
          data: [
            M1.result[0].stats.home.totalFirstServe,
            M1.result[0].stats.home.totalSecondServe,
          ],
          backgroundColor: [homeColor, "rgb(168,168,168)"],
          borderColor: "rgb(196,196,196)",
          borderWidth: 0,
        },
        {
          label: M1.awayPlayer,
          data: [
            M1.result[0].stats.away.totalFirstServe,
            M1.result[0].stats.away.totalSecondServe,
          ],
          backgroundColor: [awayColor, "rgb(168,168,168)"],
          borderColor: "rgb(196,196,196)",
          borderWidth: 0,
        },
      ],
    },
    options: {
      elements: {
        center: {
          text1: toPercentage(
            M1.result[0].stats.home.totalFirstServe,
            M1.result[0].stats.home.totalSecondServe
          ),
          text2: toPercentage(
            M1.result[0].stats.away.totalFirstServe,
            M1.result[0].stats.away.totalSecondServe
          ),
          color1: homeColor, // Default is #000000
          color2: awayColor,
          fontStyle: "Arial", // Default is Arial
          sidePadding: 20, // Default is 20 (as a percentage)
          minFontSize: 14, // Default is 20 (in px), set to false and text will not wrap.
          maxFontSize: 30,
          lineHeight: 30, // Default is 25 (in px), used for when text wraps
        },
      },
      title: {
        display: true,
        text: "Tỉ lệ giao bóng 1 & 2",
      },
      cutoutPercentage: 80,
      legend: {
        display: false,
        labels: {
          fontColor: "rgb(255, 99, 132)",
          boxWidth: 10,
        },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
      },
    },
  });

  var ctx2 = document.getElementById("serve1stInChart");
  var serve1StInChart = new Chart(ctx2, {
    type: "doughnut",
    data: {
      labels: ["Bóng-1 Vào", ""],
      datasets: [
        {
          label: "Home",
          data: [
            M1.result[0].stats.home.totalFirstServe,
            M1.result[0].stats.home.totalSecondServe,
          ],
          backgroundColor: ["rgb(54, 162, 235)", "rgb(168,168,168)"],
          borderColor: "gray",
          borderWidth: 0,
        },
        {
          label: "Away",
          data: [
            M1.result[0].stats.away.totalFirstServe,

            M1.result[0].stats.away.totalSecondServe,
          ],
          backgroundColor: ["rgb(255, 205, 86)", "rgb(168,168,168)"],
          borderColor: "gray",
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: {
        labels: {
          display: false,
          render: "percentage",
          color: null,
        },
        datalabels: {
          color: null,
        },
      },
      elements: {
        center: {
          text1: toPercentage(
            M1.result[0].stats.home.totalFirstServe,

            M1.result[0].stats.home.totalSecondServe
          ),
          text2: toPercentage(
            M1.result[0].stats.away.totalFirstServe,

            M1.result[0].stats.away.totalSecondServe
          ),
          color1: "rgba(54,162,235,1)", // Default is #000000
          color2: "rgb(255, 205, 86)",
          fontStyle: "Arial", // Default is Arial
          sidePadding: 20, // Default is 20 (as a percentage)
          minFontSize: 14, // Default is 20 (in px), set to false and text will not wrap.
          maxFontSize: 30,
          lineHeight: 30, // Default is 25 (in px), used for when text wraps
        },
      },
      cutoutPercentage: 80,
      title: {
        display: true,
        text: "Tỉ lệ giao bóng 1 VÀO sân",
      },
      legend: {
        display: false,
        labels: {
          fontColor: "rgb(255, 99, 132)",
          boxWidth: 10,
        },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
      },
    },
  });

  var ctx3 = document.getElementById("serve1stWonChart");
  var serve1stWonChart = new Chart(ctx3, {
    type: "doughnut",
    data: {
      //labels: [Globals.homeName,Globals.awayName],
      datasets: [
        {
          label: "Home",
          data: [
            M1.result[0].stats.home.firstServeWin,
            M1.result[0].stats.home.totalFirstServe,
          ],
          backgroundColor: ["rgb(54, 162, 235)", "rgb(168,168,168)"],
          borderColor: "gray",
          borderWidth: 0,
        },
        {
          label: "Away",
          data: [
            M1.result[0].stats.away.firstServeWin,
            M1.result[0].stats.away.totalFirstServe,
          ],
          backgroundColor: ["rgb(255, 205, 86)", "rgb(168,168,168)"],
          borderColor: "gray",
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: {
        labels: {
          render: "percentage",
        },
        datalabels: {
          color: null,
        },
      },
      title: {
        display: true,
        text: "Tỉ lệ giao-bóng-1 ăn điểm",
      },
      elements: {
        center: {
          text1: toPercentage(
            M1.result[0].stats.home.firstServeWin,
            M1.result[0].stats.home.totalFirstServe
          ),
          text2: toPercentage(
            M1.result[0].stats.away.firstServeWin,
            M1.result[0].stats.away.totalFirstServe
          ),
          color1: "rgba(54,162,235,1)", // Default is #000000
          color2: "rgb(255, 205, 86)",
          fontStyle: "Arial", // Default is Arial
          sidePadding: 20, // Default is 20 (as a percentage)
          minFontSize: 14, // Default is 20 (in px), set to false and text will not wrap.
          maxFontSize: 30,
          lineHeight: 30, // Default is 25 (in px), used for when text wraps
        },
      },
      cutoutPercentage: 80,
      legend: {
        display: true,
        labels: {
          fontColor: "rgb(255, 99, 132)",
          boxWidth: 10,
        },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
      },
    },
  });

  var ctx4 = document.getElementById("serve2ndWonChart");
  var serve2ndWonChart = new Chart(ctx4, {
    type: "doughnut",
    data: {
      //labels: [Globals.homeName,Globals.awayName],
      datasets: [
        {
          label: "Home",
          data: [
            M1.result[0].stats.home.secondServeWin,
            M1.result[0].stats.home.totalSecondServe,
          ],
          backgroundColor: ["rgb(54, 162, 235)", "rgb(168,168,168)"],
          borderColor: "white",
          fontColor: ["black", "gray"],
          borderWidth: 0,
        },
        {
          label: "Away",
          data: [
            M1.result[0].stats.away.secondServeWin,
            M1.result[0].stats.away.totalSecondServe,
          ],
          backgroundColor: ["rgb(255, 205, 86)", "rgb(168,168,168)"],
          borderColor: "white",
          fontColor: ["black", "gray"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: {
        labels: {
          render: "percentage",
        },
        datalabels: {
          color: null,
        },
      },
      title: {
        display: true,
        text: "Tỉ lệ giao-bóng-2 ăn điểm",
      },
      elements: {
        center: {
          text1: toPercentage(
            M1.result[0].stats.home.secondServeWin,
            M1.result[0].stats.home.totalSecondServe
          ),
          text2: toPercentage(
            M1.result[0].stats.away.secondServeWin,
            M1.result[0].stats.away.totalSecondServe
          ),
          color1: "rgba(54,162,235,1)", // Default is #000000
          color2: "rgb(255, 205, 86)",
          fontStyle: "Arial", // Default is Arial
          sidePadding: 20, // Default is 20 (as a percentage)
          minFontSize: 14, // Default is 20 (in px), set to false and text will not wrap.
          maxFontSize: 30,
          lineHeight: 30, // Default is 25 (in px), used for when text wraps
        },
      },
      cutoutPercentage: 80,
      legend: {
        display: true,
        labels: {
          fontColor: "rgb(255, 99, 132)",
          boxWidth: 10,
        },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
      },
    },
  });
}
