const express = require("express");
const app= express();
const dotenv = require("dotenv");
const router = require('express').Router();
const controller = require('../controllers/authController')

router.post('/register', controller.register);
router.post('/login', controller.login)

module.exports =router;
