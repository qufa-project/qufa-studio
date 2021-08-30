const axios = require('axios');

class MkfeatManager {

  /**
   * 
   * @param {Object} mkfeatOptions 
   * @param {string} mkfeatOptions.endpoint
   */
  constructor(mkfeatOptions) {
    this.endpoint = mkfeatOptions.endpoint
  }

  options = () => {
    return {
      endpoint: this.endpoint
    }
  }

  /**
   * 
   * @param {Object} data 
   * @param {string} data.uri  S3 파일 경로 ex) s3://~
   * @param {[{name:string, type:string, key:boolean}]} data.columns 컬럼 정보 배열 {name:string, type:string, key:bool}
   * @param {[string]} data.operator 연산자 종류 배열
   */
  extract = (data) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await axios.default.post(`${this.endpoint}/extract`, data)
        resolve(result)
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * 
   * @param {number} tid mkdeat에서 받아온 tid
   */
  getStatus = (tid) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await axios.default.get(`${this.endpoint}/extract/${tid}/status`)
        resolve(result)
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * 
   * @param {number} tid mkdeat에서 받아온 tid
   */
  getFeatureinfo = (tid) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await axios.default.get(`${this.endpoint}/extract/${tid}/featureinfo`)
        resolve(result)
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * 
   * @param {number} tid mkdeat에서 받아온 tid
   */
  stopJob = (tid) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await axios.default.put(`${this.endpoint}/extract/${tid}/stop`)
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
  deleteJob = (tid) => {
    return new Promise(async (resolve, reject) => {
      try {
        const status = await this.getStatus(tid)
        if(status.data.progress < 100) {
          try {
            const result = await this.stopJob(tid)
          } catch (err){
            if(err.response.data.errcode == "ERR_COMPLETED") {
              //do nothing already completed
            } else {
              throw err
            }
          }
        }
        const result = await axios.default.delete(`${this.endpoint}/extract/${tid}`)
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
        const extractResponse = await this.extract(data);
        const tid = extractResponse.data.tid
        
        let loopCount = 0
        while(true) {
          if(loopCount > 1000) {
            throw new Error("Something wrong. Check Mkfeat api server.")
          }
          this.wait(1000)
          const statusResponse = await this.getStatus(tid)
          const progress = statusResponse.data.progress

          if(progress >= 100) {
            break;
          }
          loopCount++
        }

        const featureInfoResponse = await this.getFeatureinfo(tid);

        await this.deleteJob(tid);

        resolve(featureInfoResponse.data);
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