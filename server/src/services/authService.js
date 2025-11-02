const express = require("express");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const repo = require('../repository/authRepository')


const JWT_SECRET = process.env.JWT_SECRET;

//company registeration , pan card, gst as pdf
//
const register = async ({ name, email, password, confirmPassword, phone, address, Company_name, pan, gst, company_reg, role = 'user' }) => {
  if (!name || !email || !password) {
    throw new Error("Name, email and password are required");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const existingUser = await repo.getUserByEmail(email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("🔐 Password hashed successfully");

  try {
    const user = await repo.createUser({ name, email, password: hashedPassword, role });
    console.log("✅ User created in DB:", user);
    return { 
      message: 'User registered successfully', 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  } catch (err) {
    console.error("❌ DB Error:", err.message);
    throw new Error("Database insert failed: " + err.message);
  }
};


const login = async ({email, password}) => {
  console.log("🔐 Login attempt for:", email);
  
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const user = await repo.getUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error("Invalid password");
  }

  // Check if user is approved (for traders)
  if (user.role === 'user' || user.role === 'trader') {
    if (user.approval_status !== 'approved') {
      throw new Error("Account pending approval. Please contact admin.");
    }
    if (!user.is_active) {
      throw new Error("Account is inactive. Please contact admin.");
    }
  }

  const token = jwt.sign(
    { 
      id: user.id, 
      role: user.role || 'user',
      email: user.email 
    }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );

  console.log("✅ Login successful for user:", user.email);
  return {
    message: 'Login successful', 
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user'
    }
  };
};

    
module.exports = {register, login};
