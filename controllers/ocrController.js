const axios = require("axios");
const fs = require("fs");

require("dotenv").config();

const apikey = process.env.OCR_API;

const url = "https://api.ocr.space/parse/image";
const callopenai = require("../controllers/openaiController");
const cleanup = require("../controllers/cleanUp");
const atoj = require("../controllers/arraytoJson");
const palmController = require("./palmController");
const geminiController = require("./geminiContr");
/* const fpath = "./img.jpg";
const file = fs.readFileSync(fpath);
const formData = new FormData();
formData.append("file", new Blob([file], { type: "image/jpeg" }), "image.jpg"); */

const ocrController = async (req, res) => {
  console.log(req.file);
  console.log(req.file.buffer);
  try {
    const formData = new FormData();
    const file = fs.readFileSync(req.file.path);
    formData.append(
      "file",
      new Blob([file], { type: req.file.mimetype }),
      req.file.originalname
    );
    console.log(apikey);
    const response = await axios.post(url, formData, {
      headers: {
        apikey: apikey,
        OCREngine: 2,
        "Content-Type": "multipart/form-data",
      },
    });

    if (response) {
      const data = response.data.ParsedResults[0].ParsedText;
      console.log(data);
      await cleanup(`./uploads/${req.file.filename}`);
      //const cleandata = await callopenai(data);
      const cleandata = await geminiController(data);
      if (cleandata !== null) {
        const jsondata = atoj(cleandata.split(","));
        res.status(200).json(jsondata);
      }

      res.status(500);
    } else {
      next();
    }
  } catch (err) {
    console.log(err.message);
  }
};

module.exports = ocrController;
