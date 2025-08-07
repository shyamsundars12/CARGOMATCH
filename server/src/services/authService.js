const express = require("express");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const repo = require('../repository/authRepository')


const JWT_SECRET = process.env.JWT_SECRET;

//company registeration , pan card, gst as pdf
//
 const register = async ({ name, email, password, confirmPassword, phone, address , Company_name, pan, gst, company_reg }) => {
  if (!name || !email || !password) {
    throw new Error("name, email and password required");
  }

  const existingUser = await repo.getUserByEmail(email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("Hashed Password:", hashedPassword);

  try {
    const user = await repo.createUser({ name, email, password: hashedPassword });
    console.log("User created in DB:", user);
    return { message: 'User registered successfully', user };
  } catch (err) {
    console.error("❌ DB Error:", err.message);  // 👈 THIS is the key
    throw new Error("Database insert failed: " + err.message);
  }
};


const login = async ({email, password})=>{
  console.log(email, password);
    if(!email || !password) {
        throw new Error("email and password required");
}
const user = await repo.getUserByEmail(email);
if(!user) {
    throw new Error("user not found");
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if(!isValidPassword) {
        throw new Error("invalid password");
        }
        const token = jwt.sign({id : user.id}, JWT_SECRET, {expiresIn : '1h'});
        return {message : 'logged in successfully', token};
        };

    
module.exports = {register, login};
