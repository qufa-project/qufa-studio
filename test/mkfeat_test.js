var assert = require("assert")
const MkfeatManager = require('../lib/MkfeatManager')
var expect = require("chai").expect
var should = require("chai").should

const config = require('../configs/config');


const SAMPLE_DATA =  {
  "data": {
      "uri": "s3://qufa-test/mkfeat/nyc_taxi_train_test_10k.csv",
      "columns": [
          {
              "name": "id",
              "type": "string",
              "key": true
          },
          {
              "name": "vendor_id",
              "type": "string"
          },
          {
              "name": "pickup_datetime",
              "type": "string"
          },
          {
              "name": "passenger_count",
              "type": "string"
          },
          {
              "name": "pickup_longitude",
              "type": "string"
          },
          {
              "name": "pickup_latitude",
              "type": "string"
          },
          {
              "name": "dropoff_longitude",
              "type": "string"
          },
          {
              "name": "dropoff_latitude",
              "type": "string"
          },
          {
              "name": "store_and_fwd_flag",
              "type": "string"
          },
          {
              "name": "trip_duration",
              "type": "string"
          },
          {
              "name": "test_train",
              "type": "string"
          }
      ]
  },
  "operator": [
      "sum",
      "minute"
  ]
}

function delay(interval) {
  return it('should delay', done => {
    setTimeout(() => done(), interval)
  }).timeout(interval + 100) // The extra 100ms should guarantee the test will not fail due to exceeded timeout
}

describe('Mkfeat Manager', function() {
  describe('Create Manager', function() {
    const mkfeatManager = new MkfeatManager({
      endpoint: config.mkfeat.url
    })

    it('Create Manager With options', function() {
      const option = mkfeatManager.options()
      expect(option.endpoint).to.equal(config.mkfeat.url)
    })
    
    it('Call Extract With Invalid data', async function() {
      try {
        const result = await mkfeatManager.extract({
          data: 'invalid Data',
          columns: [],
          operator: []
        })
        expect(result).to.be.null
      } catch (err) {
        expect(err).to.not.be.null
        expect(err.response.status).to.equal(400)
        expect(err.response.data.errcode).to.equal('ERR_INVALID_ARG')
      }
    })

    it('Call Extract With Valid Uri But Column count', async function() {
      try {
        const wrongSampleData = JSON.parse(JSON.stringify(SAMPLE_DATA))
        wrongSampleData.data.columns.pop()

        const result = await mkfeatManager.extract(wrongSampleData)
        expect(result).to.be.null
      } catch (err) {
        expect(err).to.not.be.null
        expect(err.response.status).to.equal(400)
        expect(err.response.data.errcode).to.equal('ERR_COLUMN_COUNT_MISMATCH')
      }
    })

    describe('Call apis with Tids', function() {
      
      it('Call Extract With Completely Valid Datum', async function() {
        try {
          const tid = await mkfeatManager.extract(SAMPLE_DATA)
          expect(tid).to.not.null
          expect(tid).to.be.a('number')
        } catch (err) {
          expect(err).to.be.null
        }
      })

      it(`tid`, function() {
        //do nothing
        console.log(`=============${mkfeatManager.getTid()}============`)
      })

      it('Get Status With valid Tid', async function() {
        try {
          const progress = await mkfeatManager.getProgress()
          expect(progress).to.be.a('number')
        } catch (err) {
          console.log(err)
          expect(err).to.be.null
        }
      })

      // 시간이 오래 걸리는 작업으로 필요시 주석 해제 하여 테스트 하세요
      
      // delay(20000)
      // it('Get FeatureInfo With valid Tid', async function() {
      //   try {
      //     const featureInfo = await mkfeatManager.getFeatureinfo()
      //     console.log(featureInfo)
      //     expect(featureInfo).to.be.an('Array')
      //   } catch (err) {
      //     console.log(err.response.data)
      //     expect(err).to.be.null
      //   }
      // })

      it('delete job with tid', async function() {
        try {
          const result = await mkfeatManager.deleteJob()
          expect(result.status).to.equal(200)
        } catch (err) {
          expect(err).to.be.null
        }
      })
    })
  })

  describe('Mkfeat Manager batch job', function() {
    it('batch', async function() {
      const mkfeatManager = new MkfeatManager({endpoint: config.mkfeat.url});
      const result = await mkfeatManager.batchJob(SAMPLE_DATA);
      expect(result).to.be.an('Array')
    })
  })
})