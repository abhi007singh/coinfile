const router = require("express").Router();
const tradeRouter = require("./trade");

router.use("/trade", tradeRouter);

module.exports = router;