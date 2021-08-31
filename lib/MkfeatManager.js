const axios = require('axios');

// 클래스 내부 변수
const ENDPOINT = Symbol("endpoint")
const TID = Symbol("tid")

class MkfeatManager {

  /**
   * 
   * @param {Object} mkfeatOptions 
   * @param {string} mkfeatOptions.endpoint
   */
  constructor(mkfeatOptions) {
    this[ENDPOINT] = mkfeatOptions.endpoint
  }

  options = () => {
    return {
      endpoint: this[ENDPOINT]
    }
  }

  getTid = () => {
    return this[TID]
  }

  /**
   * 
   * @param {Object} data 
   * @param {string} data.uri  S3 파일 경로 ex) s3://~
   * @param {[{name:string, type:string, key:boolean}]} data.columns 컬럼 정보 배열 {name:string, type:string, key:bool}
   * @param {[string]} data.operator 연산자 종류 배열
   * 
   * @returns {number} tid
   */
  extract = (data) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await axios.default.post(`${this[ENDPOINT]}/extract`, data);
        if(!result.data || !result.data.tid) {
          throw new Error("Cannot detect tid from response");
        }
        this[TID] = result.data.tid;
        resolve(result.data.tid)
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * 
   * @param {number} tid mkdeat에서 받아온 tid
   */
  getProgress = () => {
    return new Promise(async (resolve, reject) => {
      try {
        if(!this[TID]) {
          throw Error("Cannot find tid, please call extract first")
        }
        const result = await axios.default.get(`${this[ENDPOINT]}/extract/${this[TID]}/status`)
        if(!result.data || !result.data.progress) {
          throw new Error("Cannot detect tid from response");
        }
        resolve(result.data.progress)
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * 
   * @param {number} tid mkdeat에서 받아온 tid
   */
  getFeatureinfo = () => {
    return new Promise(async (resolve, reject) => {
      try {
        if(!this[TID]) {
          throw Error("Cannot find tid, please call extract first")
        }
        const result = await axios.default.get(`${this[ENDPOINT]}/extract/${this[TID]}/featureinfo`)
        if(!result.data) {
          throw new Error("Cannot detect tid from response");
        }
        resolve(result.data)
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * 
   * @param {number} tid mkdeat에서 받아온 tid
   */
  stopJob = () => {
    return new Promise(async (resolve, reject) => {
      try {
        if(!this[TID]) {
          throw Error("Cannot find tid, please call extract first")
        }
        const result = await axios.default.put(`${this[ENDPOINT]}/extract/${this[TID]}/stop`)
        resolve(result)
      } catch(err) {
        reject(err)
      }
    })
  }

  /**
   * 
   * @param {number} tid mkdeat에서 받아온 tid
   */
  deleteJob = () => {
    return new Promise(async (resolve, reject) => {
      try {
        if(!this[TID]) {
          throw Error("Cannot find tid, please call extract first")
        }
        const progress = await this.getProgress()
        if(progress < 100) {
          try {
            await this.stopJob()
          } catch (err){
            if(err.response.data.errcode == "ERR_COMPLETED") {
              //do nothing already completed
            } else {
              throw err
            }
          }
        }
        const result = await axios.default.delete(`${this[ENDPOINT]}/extract/${this[TID]}`)
        resolve(result)
      } catch (err) {
        // console.log(err)
        reject(err)
      }
    })
  }

  /**
   * extract 요청부터 결과를 받고, 삭제까지 한전에 진행한다.
   * 
   * @param {Object} data 
   * @param {string} data.uri  S3 파일 경로 ex) s3://~
   * @param {[{name:string, type:string, key:boolean}]} data.columns 컬럼 정보 배열 {name:string, type:string, key:bool}
   * @param {[string]} data.operator 연산자 종류 배열
   */
  batchJob = async (data) => {
    return new Promise( async (resolve, reject) => {
      try {
        await this.extract(data);
        
        let loopCount = 0
        while(true) {
          if(loopCount > 1000) {
            throw new Error("Something wrong. Check Mkfeat api server.")
          }
          this.wait(1000)
          const progress = await this.getProgress()
          if(progress >= 100) {
            break;
          }
          loopCount++
        }

        const featureInfo = await this.getFeatureinfo();

        await this.deleteJob();

        resolve(featureInfo);
      } catch (err) {
        reject(err)
      }
    })

  }

  wait = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

module.exports = MkfeatManager