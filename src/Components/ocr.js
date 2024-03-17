async function loadImage(imagePath) {
    //"""Loads an image using the FileReader API."""
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  }
  
  async function preprocessImage(image) {
    //"""Converts the image to grayscale using a canvas element."""
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const img = new Image();
    img.src = image;
    await new Promise((resolve) => img.onload = resolve);
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = data[i + 1] = data[i + 2] = brightness;
    }
    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  }
  
  async function extractFeatures(image) {
   // """Uses Tesseract.js to extract text features from the image."""
    const Tesseract = await Tesseract.recognize(image, 'eng', {tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'});
    return Tesseract.data.text;
  }
  
  async function recognizeText(features) {
    //Processes the extracted features and returns the recognized text.
   // # Placeholder for potential post-processing like character corrections
    return features;
  }
  
  async function ocr(imagePath) {
   // """Performs the complete OCR process."""
    const image = await loadImage(imagePath);
    const preprocessedImage = await preprocessImage(image);
    const features = await extractFeatures(preprocessedImage);
    const text = await recognizeText(features);
    return text;
  }
  
  // Example usage
  const imagePath = "path/to/your/image.png";
  ocr(imagePath)
    .then(text => console.log(text))
    .catch(error => console.error(error));
  