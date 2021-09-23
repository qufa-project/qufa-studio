const axios = require("axios");

// 클래스 내부 변수
const ENDPOINT = Symbol("endpoint");
const EXTRACT_TID = Symbol("extract_tid");
const IMPORTANCE_TID = Symbol("importance_tid");

class MkfeatManager {
  /**
   *
   * @param {Object} mkfeatOptions
   * @param {string} mkfeatOptions.endpoint
   */
  constructor(mkfeatOptions) {
    this[ENDPOINT] = mkfeatOptions.endpoint;
  }

  options = () => {
    return {
      endpoint: this[ENDPOINT],
    };
  };

  getExtractTid = () => {
    return this[EXTRACT_TID];
  };

  getImportanceTid = () => {
    return this[IMPORTANCE_TID];
  };

  /**
   *
   * @param {Object} payload
   * @param {Object} payload.data
   * @param {string} payload.data.uri  S3 파일 경로 ex) s3://~
   * @param {[{name:string, type:string, key:boolean}]} payload.data.columns 컬럼 정보 배열 {name:string, type:string, key:bool}
   * @param {[string]} payload.operator 연산자 종류 배열
   *
   * @returns {number} tid
   */
  extract = (payload) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await axios.default.post(
          `${this[ENDPOINT]}/extract`,
          payload
        );
        if (result.data == undefined || result.data.tid == undefined) {
          throw new Error("Cannot detect tid from response");
        }
        this[EXTRACT_TID] = result.data.tid;
        resolve(result.data.tid);
      } catch (err) {
        reject(err);
      }
    });
  };

  saveExtract = (dataset) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await axios.default.put(
          `${this[ENDPOINT]}/extract/${this[EXTRACT_TID]}/save`,
          {
            uri: dataset.getFeatureUrl(),
          }
        );
        console.log("saveExtract ============================");

        if (result.status != 200) {
          console.log(result);
          throw new Error("Cannot detect tid from response");
        }
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   *
   * @param {Object} payload
   * @param {Object} payload.data
   * @param {string} payload.data.uri  S3 파일 경로 ex) s3://~
   * @param {[{name:string, type:string, train:boolean, label:boolean}]} payload.data.columns 컬럼 정보 배열 {name:string, type:string, key:bool}
   *
   * @returns {number} tid
   */
  importance = (payload) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await axios.default.post(
          `${this[ENDPOINT]}/importance`,
          payload
        );
        if (result.data == undefined || result.data.tid == undefined) {
          throw new Error("Cannot detect tid from response");
        }
        this[IMPORTANCE_TID] = result.data.tid;
        resolve(result.data.tid);
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   * 현재 Extract의 진행 상황을 받아온다.
   */
  getExtractProgress = () => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this[EXTRACT_TID]) {
          throw Error("Cannot find tid, please call extract first");
        }
        const result = await axios.default.get(
          `${this[ENDPOINT]}/extract/${this[EXTRACT_TID]}/status`
        );
        if (result.data == undefined || result.data.progress == undefined) {
          throw new Error("Cannot detect tid from response");
        }
        resolve(result.data.progress);
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   * 현재 Importance의 진행 상황을 받아온다.
   */
  getImportanceProgress = () => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this[IMPORTANCE_TID]) {
          throw Error("Cannot find tid, please call importance first");
        }
        const result = await axios.default.get(
          `${this[ENDPOINT]}/importance/${this[IMPORTANCE_TID]}/status`
        );
        if (result.data == undefined || result.data.progress == undefined) {
          throw new Error("Cannot detect progress from response");
        }
        resolve(result.data.progress);
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   *
   * @param {number} tid mkdeat에서 받아온 tid
   */
  getFeatureinfo = () => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this[EXTRACT_TID]) {
          throw Error("Cannot find tid, please call extract first");
        }
        const result = await axios.default.get(
          `${this[ENDPOINT]}/extract/${this[EXTRACT_TID]}/featureinfo`
        );
        if (result.data == undefined) {
          throw new Error("Cannot detect tid from response");
        }
        resolve(result.data);
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   *
   */
  getImportanceResult = () => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this[IMPORTANCE_TID]) {
          throw Error("Cannot find tid, please call importance first");
        }
        const result = await axios.default.get(
          `${this[ENDPOINT]}/importance/${this[IMPORTANCE_TID]}`
        );
        if (result.data == undefined) {
          throw new Error("Cannot detect tid from response");
        }
        resolve(result.data);
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   *
   */
  stopExtractJob = () => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this[EXTRACT_TID]) {
          throw Error("Cannot find tid, please call extract first");
        }
        const result = await axios.default.put(
          `${this[ENDPOINT]}/extract/${this[EXTRACT_TID]}/stop`
        );
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   *
   */
  stopImportanceJob = () => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this[IMPORTANCE_TID]) {
          throw Error("Cannot find tid, please call importance first");
        }
        const result = await axios.default.put(
          `${this[ENDPOINT]}/importance/${this[IMPORTANCE_TID]}/stop`
        );
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   *
   */
  deleteExtractJob = () => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this[EXTRACT_TID]) {
          throw Error("Cannot find tid, please call extract first");
        }
        const progress = await this.getExtractProgress();
        if (progress < 100) {
          try {
            await this.stopExtractJob();
          } catch (err) {
            if (err.response.data.errcode == "ERR_COMPLETED") {
              //do nothing already completed
            } else {
              throw err;
            }
          }
        }
        const result = await axios.default.delete(
          `${this[ENDPOINT]}/extract/${this[EXTRACT_TID]}`
        );
        resolve(result);
      } catch (err) {
        // console.log(err)
        reject(err);
      }
    });
  };

  /**
   *
   */
  deleteImportanceJob = () => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this[IMPORTANCE_TID]) {
          throw Error("Cannot find tid, please call importance first");
        }
        const progress = await this.getImportanceProgress();
        if (progress < 100) {
          try {
            await this.stopImportanceJob();
          } catch (err) {
            if (err.response.data.errcode == "ERR_COMPLETED") {
              //do nothing already completed
            } else {
              throw err;
            }
          }
        }
        const result = await axios.default.delete(
          `${this[ENDPOINT]}/importance/${this[IMPORTANCE_TID]}`
        );
        resolve(result);
      } catch (err) {
        // console.log(err)
        reject(err);
      }
    });
  };

  /**
   * extract 요청부터 결과를 받고, 삭제까지 한전에 진행한다.
   *
   * @param {Object} payload
   * @param {Object} payload.data
   * @param {string} payload.data.uri  S3 파일 경로 ex) s3://~
   * @param {[{name:string, type:string, key:boolean}]} payload.data.columns 컬럼 정보 배열 {name:string, type:string, key:bool}
   * @param {[string]} payload.operator 연산자 종류 배열
   * @param {function} progressCallback 진행상황을 100분위로 표현.
   */
  batchExtractJob = async (dataset, payload, progressCallback) => {
    return new Promise(async (resolve, reject) => {
      try {
        await this.extract(payload);

        let loopCount = 0;
        while (true) {
          if (loopCount > 1000) {
            throw new Error("Something wrong. Check Mkfeat api server.");
          }
          await this.wait(2000);
          const progress = await this.getExtractProgress();
          if (progressCallback) {
            await progressCallback(progress);
          }
          if (progress >= 100) {
            break;
          }
          loopCount++;
        }

        const featureInfo = await this.getFeatureinfo();

        await this.saveExtract(dataset);

        await this.deleteExtractJob();

        resolve(featureInfo);
      } catch (err) {
        await progressCallback(-1);
        reject(err);
      }
    });
  };

  /**
   * extract 요청부터 결과를 받고, 삭제까지 한전에 진행한다.
   *
   * @param {Object} payload
   * @param {Object} payload.data
   * @param {string} payload.data.uri  S3 파일 경로 ex) s3://~
   * @param {[{name:string, type:string, key:boolean}]} payload.data.columns 컬럼 정보 배열 {name:string, type:string, key:bool}
   * @param {[string]} payload.operator 연산자 종류 배열
   * @param {function} progressCallback 진행상황을 100분위로 표현.
   */
  batchImportanceJob = async (payload, progressCallback) => {
    return new Promise(async (resolve, reject) => {
      try {
        await this.importance(payload);

        let loopCount = 0;
        while (true) {
          if (loopCount > 1000) {
            throw new Error("Something wrong. Check Mkfeat api server.");
          }
          await this.wait(2000);
          const progress = await this.getImportanceProgress();
          if (progressCallback) {
            await progressCallback(progress);
          }
          if (progress >= 100) {
            break;
          }
          loopCount++;
        }

        const importanceResult = await this.getImportanceResult();

        await this.deleteImportanceJob();

        resolve(importanceResult);
      } catch (err) {
        await progressCallback(-1);
        reject(err);
      }
    });
  };

  wait = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
}

module.exports = MkfeatManager;
