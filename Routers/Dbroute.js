const express = require("express");

const router = express.Router();
const { mongoconfig } = require("../config/mongoconfig");

router.use(mongoconfig);

router.route("/adddata").post(require("../controllers/addData"));
router.route("/getdata").post(require("../controllers/getdbdata"));

module.exports = router;
