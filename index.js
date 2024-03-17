const express = require("express");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT;
const cors = require("cors");
const corsoptions = require("./config/CorsOptions");
const mongoose = require('mongoose')
const EmployeeModel = require('./models/Employee')

app.use(cors());

app.use(express.json());

mongoose.connect(process.env.MONGODB_URL);

app.post("/login", (req, res)=>{
  const {username, password} = req.body;
  EmployeeModel.findOne({username: username})
  .then(user =>{
    if(user) {
      if(user.password === password) {
        res.json("Success")
      } else{
        res.json("The password is incorrect")
      }
    }else{
      res.json("No record existed")
    }
  })
})

app.post('/register', (req, res) => {
  EmployeeModel.create(req.body)
  .then(employees => res.json(employees))
  .catch(err => res.json(err))
})

app.route("/").get((req, res) => {
  res.send("running");
});

app.use("/datacall", require("./middleware/ocr_middleware"));

app.use("/videocall", require("./middleware/Youtube_middleware"));

app.use("/users", require("./Routers/Dbroute"));

app.listen(PORT, () => {
  console.log(`Server running in port:${PORT}`);
});