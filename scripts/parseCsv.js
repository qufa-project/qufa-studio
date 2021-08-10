var FileManager = require("../lib/FileManager")
var MetaManager = require("../lib/MetaManager")

console.log(process.argv);
const key = process.argv[2]

run()

async function run() {
  try {
    const encoding = await MetaManager.detectEncoding(key);
    const datas = await MetaManager.parseRecord(key, encoding);
    console.log(datas);
  } catch (err) {
    console.error(err);
  }
}