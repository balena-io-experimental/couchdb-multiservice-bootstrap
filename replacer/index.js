const express = require('express');
const request = require('request');
const app = express();
const dbstring = "http://" + process.env.COUCHDB_USER + ":" + process.env.COUCHDB_PASSWORD + "@database.local:5984";
const nano = require('nano')(dbstring);

app.get('/', (req, res) => {
    res.send('This is the frontend root\n');
});

app.listen(80, () => {
    console.log('Started frontend');
});

app.get('/imsohappy/:happy', (req, res) => {
    writeDataToDB(req.params.happy);
    res.sendStatus(200);
});


app.get('/metrics/howHappy', async (req, res) => {

    res.json(await readHappyValue());
});

const replacerDB = nano.use(process.env.COUCHDB_DBNAME);

replacerDB.insert(
    {
        "_id": "_design/metrics",
        "views":
        {
            "howHappy":
            {
                "map": function (doc) {
                    if (doc.happy) {
                        emit(doc.happy, 1);
                    }
                },
                "reduce": function (keys, values) {
                    return sum(values);
                }
            }
        }
    });


const writeDataToDB = async (amIHappy) => {
    console.log(`Happy value: ${amIHappy}`)
    await replacerDB.insert({ happy: amIHappy }, 'id' + Date.now())
}


const readHappyValue = async () => {
    const body = await replacerDB.view('metrics', 'howHappy', { group: true })
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


setInterval(writeDataToDB, 1000, "yes");
setInterval(writeDataToDB, 2000, "no");
setInterval(writeDataToDB, 2100, "again");

setInterval(readHappyValue, 5000);