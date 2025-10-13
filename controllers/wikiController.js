const wiki = require("wikipedia");

const wikiController = async (data) => {
  data = data.split(" ").join("");
  console.log(data.toLowerCase());
  let page = null;
  let intro = null;
  let fullurl = null;
  let refs = null;
  try {
    page = await wiki?.page(data.toLowerCase());
    intro = await page?.intro();
    fullurl = page?.fullurl;
    refs = await page?.references();
  } catch (err) {
    //logs
    console.log(err.message);
  }
  const content = {
    intro: intro,
    fullurl: fullurl,
    ref: refs,
  };
  return content;
};

module.exports = wikiController;
