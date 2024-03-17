const { client } = require("../config/mongoconfig");

const adddata = async (req, res) => {
  const data = req.body;
  const col = client.db("myusercreds").collection("userdata");
  try {
    const user = await col.findOne({ user: data.user });

    if (user === null) {
      const searchdata = {};
      searchdata[data.subject] = data.srcdata;
      const add = await col.insertOne({
        user: data.user,
        searchdata: searchdata,
      });
      res.json({ message: "user and data inserted" });
    } else {
      if (user.searchdata[data.subject] === undefined) {
        const searchdata = user.searchdata;
        searchdata[data.subject] = data.srcdata;
        const upres = await col.updateOne(
          { user: data.user },
          {
            $set: { searchdata: searchdata },
          }
        );

        res.status(200).json({ message: "data inserted" });
      } else {
        console.log(user.searchdata[data.subject]);
        res.status(409).json({ message: "topic already exist" });
      }
    }
  } catch (err) {
    console.log(err.message);
  }
};

module.exports = adddata;
