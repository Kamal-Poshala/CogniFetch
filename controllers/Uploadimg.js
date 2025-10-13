const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

// Example route handler for uploading an image
async function uploadImage(req, res, next) {
  const { buffer } = req.file;

  try {
    // Load the image data into a canvas
    const image = await loadImage(buffer);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);

    // Convert the canvas to a base64-encoded string
    const dataURL = canvas.toDataURL("image/png");
    const base64Image = dataURL.replace(/^data:image\/png;base64,/, "");

    // Send the image data to the OCR API
    const response = await axios.post("https://api.ocr.space/parse/image", {
      apikey: process.env.OCR_API,
      filetype: "JPG",
      base64image: base64Image,
    });

    console.log(response.data);
    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error processing image");
  }
  next();
}

module.exports = uploadImage;
