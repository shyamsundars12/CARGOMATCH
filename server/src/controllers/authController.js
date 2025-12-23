const authService = require('../services/authService');


const register = async (req, res) => {
  console.log("📩 Incoming request:", req.body);

  try {
    const result = await authService.register(req.body);
    console.log("✅ Registration result:", result);
    res.status(201).json(result);
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    res.status(400).json({ error: err.message });
  }
};

const login = async(req, res)=>{
  try{
    const result = await authService.login(req.body);
        console.log("✅ login result:", result);  
        res.status(200).json(result);
  }catch(err){
    console.error("❌ Login error:", err.message);
    res.status(400).json({error: err.message});
  }
};

module.exports = {register, login};