const router = require("express").Router();
const multer = require("multer");
const { z } = require("zod");

const db = require("../db");
const client = db.getClient();

const upload = multer({
    fileFilter: function (req, file, cb) {
        file.mimetype === 'text/csv' ? cb(null, true) : cb(null, false)
    }
});

router.get("/", async (req, res) => {
    try {
        const coll = client.db('myDatabase').collection('trade');
        const cursor = coll.find({});
        const result = await cursor.toArray();
        res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
});

router.post("/parse", upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(411).json({ message: "Error in file upload" });

    const csvArr = req.file.buffer.toString().split("\r");
    const headers = csvArr[0].split(",");

    let result = [];

    for (let i = 1; i < csvArr.length; i++) {
        let obj = {};

        let csv = csvArr[i].split(",");

        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = csv[j].trim();
        }

        result.push(obj)
    }

    try {
        await client.db('myDatabase').collection('trade').insertMany(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }

    res.json({ message: "CSV data saved to DB" });
});

router.post("/balance", async (req, res) => {
    const mySchema = z.object({
        timestamp: z.string().regex(/(^2[0-9]{3}-(0?[1-9]|1?[012])-(0?[1-9]|[12][0-9]|3[01]) (?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d))/g)
    });

    const { success, data } = mySchema.safeParse(req.body);
    if (!success) return res.status(411).json({ message: "Validation Error" });
    // console.log(data);
    /*
    * Requires the MongoDB Node.js Driver
    * https://mongodb.github.io/node-mongodb-native
    */

    const agg = [
        {
            '$match': {
                'UTC_Time': {
                    '$lte': data.timestamp
                }
            }
        }, {
            '$project': {
                'coin': '$Market',
                'buyOrder': {
                    '$cond': [
                        {
                            '$eq': [
                                '$Operation', 'Buy'
                            ]
                        }, {
                            '$toInt': '$Buy/Sell Amount'
                        }, 0
                    ]
                },
                'sellOrder': {
                    '$cond': [
                        {
                            '$eq': [
                                '$Operation', 'Sell'
                            ]
                        }, {
                            '$toInt': '$Buy/Sell Amount'
                        }, 0
                    ]
                }
            }
        }, {
            '$group': {
                '_id': '$coin',
                'BuyTotal': {
                    '$sum': '$buyOrder'
                },
                'SellTotal': {
                    '$sum': '$sellOrder'
                }
            }
        }
    ];

    try {
        const coll = client.db('myDatabase').collection('trade');
        const cursor = coll.aggregate(agg);
        const result = await cursor.toArray();
        // console.log(result);
        let balance = {};
        result.forEach(r => {
            balance[r._id.split("/")[0]] = r.BuyTotal - r.SellTotal;
        });

        res.json(balance);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
});

module.exports = router;