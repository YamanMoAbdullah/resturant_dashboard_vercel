const express = require('express');
const dashboardRouter = express.Router();
const dashboardController = require('../adminControllers/dashboardController');
const isAllowed = require('../middleware/checkPermission');
const isAuth = require('../middleware/auth');

dashboardRouter.get('/admin/dashboard', isAllowed, dashboardController.dashboard);
dashboardRouter.get('/admin/stats', isAuth, dashboardController.get_stats);

module.exports = dashboardRouter;