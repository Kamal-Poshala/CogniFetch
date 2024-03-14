const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
router
  .route("/")
  .post(upload.single("image"), require("../controllers/ocrController"))
  .get((req, res) => {
    res.send("running");
  });

module.exports = router;
