const child_process = require("child_process");

function runCsvParser(dataset, parseOption) {
  const ls = child_process.spawn("node", [
    "./scripts/parseCsv.js",
    JSON.stringify({
      datasetId: dataset.id,
      parseOption: parseOption,
    }),
  ]);

  ls.stdout.on("data", function (data) {
    console.log("stdout: " + data);
  });

  ls.stderr.on("data", function (data) {
    console.log("stderr: " + data);
  });

  ls.on("exit", function (code) {
    console.log("exit: " + code);
  });
}

module.exports = {
  runCsvParser,
};
