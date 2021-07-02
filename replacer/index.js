const express = require('express');
const request = require('request');
const app = express();
const dbstring = "http://" + process.env.COUCHDB_USER + ":" + process.env.COUCHDB_PASSWORD + "@database.local:5984";
const nano = require('nano')(dbstring);

app.listen(80, () => {
    console.log('Started frontend');
});

const upstreamDB = nano.use(process.env.COUCHDB_UPSTREAM_DBNAME);

const downstreamDB = nano.use(process.env.COUCHDB_DOWNSTREAM_DBNAME);

upstreamDB.insert(
    {
        "_id": "_design/metrics",
        "views":
        {
            "enrgUse":
            {
                "map": function (doc) {
                    encodeURIComponent(doc._id, doc.metrics.enrgUse)
                },
                "reduce": function (keys, values) {
                    return sum(values);
                }
            }
        }
    }).catch()

const readIoTMetrics = async () => {
    const body = await upstreamDB.view('metrics', 'enrgUse', { group: false })
    body.rows.forEach((doc) => {
        console.log(doc.value)
    })


    const newRows = body.rows.map(element => {
        let newKey = {}
        newKey[element.key] = element.value
        return newKey
    })
    console.log(newRows)
    return { newRows };
}

const writeDataToDB = async (metrics) => {
    console.log(`IOT Metrics: ${JSON.stringify(metrics)}`)
    await upstreamDB.insert({ metrics: metrics, deviceuuid: process.env.BALENA_DEVICE_UUID }, 'id' + Date.now())
}


const readConfig = async () => {

    const doclist = await downstreamDB.list()
    doclist.rows.forEach(async (doc) => {
        console.log(await downstreamDB.get(doc.id))
    });
}


app.post('/iotMetric', (req, res) => {
    console.log(req.body)
    writeDataToDB(req.body);
    res.sendStatus(200);
});

// { "temperatur": 27, "enrgUse": 2 , "cpu": 0.8 }
// setInterval(writeDataToDB, 1000, { "temperatur": 27 * Math.random(), "enrgUse": 2 * Math.random(), "cpu": Math.random(), });
// setInterval(writeDataToDB, 2000, { "temperatur": 27 * Math.random(), "enrgUse": 2 * Math.random(), "cpu": Math.random(), });
// setInterval(writeDataToDB, 2100, { "temperatur": 27 * Math.random(), "enrgUse": 2 * Math.random(), "cpu": Math.random(), });

// setInterval(readIoTMetrics, 5000);

setInterval(readConfig, 5000);