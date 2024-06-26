require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const db = require('./db');
const router = require("./routes");

const PORT = process.env.PORT || 3000;

const app = express();

app.use("/public", express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use('/api/v1', router);
app.get("*", (req, res) => {
    res.redirect("/api/v1/trade/");
});

(async () => {
    await db.init();

    app.listen(PORT, (err) => {
        console.log(`Server is up at localhost ${PORT}`);
    });
})();

process.on('exit', async () => {
    const client = db.getClient();
    await client.close();
    console.log('Closing MongoDB');
});