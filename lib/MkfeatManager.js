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

  deleteJob = (tid) => {
    return new Promise(async (resolve, reject) => {
      try {
        const status = await this.getStatus(tid)
        if(status.progress < 100) {
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
        reject(err)
      }
    })
  }
}

module.exports = MkfeatManager