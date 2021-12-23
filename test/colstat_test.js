var assert = require("assert");

const ColstatService = require("../services/ColstatService");

const colstatService = new ColstatService();

describe("ColStat Service", function () {
  describe("check calculate column count", function () {
    it("should return pair of column name & count value", async () => {
      const colStats = await colstatService.calcColStat(92);
      assert.equal(colStats.length % 2, 0);
    });
  });
});
