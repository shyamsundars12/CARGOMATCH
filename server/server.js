const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./src/routes/authRoutes");
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Logistics Platform API is running");
});
app.use('/api/auth', authRoutes);

app.listen(PORT,()=>{
  console.log(`server is running in the port ${PORT}`);
})

