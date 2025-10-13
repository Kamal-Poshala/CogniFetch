const { MongoClient, serverApi } = require("mongodb");

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGO_URL);

const mongoconfig = async (req, res, next) => {
  try {
    await client.connect();
    console.log(`connected the mongodb client`);
    next();
  } catch (err) {
    console.log(err.message);
  }
};

module.exports = { mongoconfig, client };

/*  mongodb atlas credentials

Username---->   kamalposhala2020
Password---->   cfowtVghKR8pXwRt

*/