const express = require("express");
const router = express.Router();

router
  .route("/")
  .post(require("../controllers/YoutubeController"))
  .get((req, res) => {
    res.send("ok");
  });

module.exports = router;
