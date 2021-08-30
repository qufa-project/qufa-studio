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

    it('Get Status With Invalid Tid', async function() {
      try {
        const result = await mkfeatManager.getStatus(999999)
        expect(result).to.be.null
      } catch (err) {
        expect(err.response.status).to.equal(400)
        expect(err.response.data.errcode).to.equal('ERR_NO_TASK')
      }
    })

    describe('Call apis with Tids', function() {
      let tid;
      
      it('Call Extract With Completely Valid Datum', async function() {
        try {
          const result = await mkfeatManager.extract(SAMPLE_DATA)
          expect(result.status).to.equal(200)
          expect(result.data.tid).to.not.null
          tid = result.data.tid
        } catch (err) {
          expect(err).to.be.null
        }
      })

      it(`tid`, function() {
        //do nothing
        console.log(`=============${tid}============`)
      })

      it('Get Status With valid Tid', async function() {
        try {
          const result = await mkfeatManager.getStatus(tid)
          expect(result.status).to.equal(200)
          expect(result.data.progress).to.be.a('number')
        } catch (err) {
          console.log(err)
          expect(err).to.be.null
        }
      })

      it('Get FeatureInfo With valid Tid', async function() {
        try {
          const result = await mkfeatManager.getStatus(tid)
          expect(result.status).to.equal(200)
          expect(result.data.progress).to.be.a('number')
        } catch (err) {
          expect(err).to.be.null
        }
      })

      delay(2000)

      it('delete job with tid', async function() {
        try {
          const result = await mkfeatManager.deleteJob(tid)
          expect(result.status).to.equal(200)
        } catch (err) {
          expect(err).to.be.null
        }
      })
    })
    
  })
})