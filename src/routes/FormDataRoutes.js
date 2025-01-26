const express = require("express");
const authMiddleware = require("../middleware/authMiddleWare");
const { readAllSecondaryStatus } = require("../controllers/SecondaryStatusController");

const router = express.Router();

router.get("/secondary-statuses", async(_, res) => {
    try {
        const secondaryStatuses = await readAllSecondaryStatus();
        res.status(200).json(secondaryStatuses);
    } catch (error) {
        res.status(500).send("An error was encountered while reading the secondary statuses.")
    }
})

module.exports = router