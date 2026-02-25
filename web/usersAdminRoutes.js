const express = require('express');
const usersrouter = express.Router();
const usersController = require('../adminControllers/usersController');
const isAllowed = require('../middleware/checkPermission');

usersrouter.get('/admin/users', isAllowed, usersController.users);

module.exports = usersrouter;