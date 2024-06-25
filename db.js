const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URL || 'mongodb://127.0.0.1/27017';

const client = new MongoClient(uri);

const init = async () => {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log(error);
    }
};

const getClient = () => {
    return client;
};

module.exports.init = init;
module.exports.getClient = getClient;