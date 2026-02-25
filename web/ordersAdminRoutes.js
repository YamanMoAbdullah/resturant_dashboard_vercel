const express = require('express');
const orderRouter = express.Router();
const orderController = require('../adminControllers/ordersController');
const isAuth = require('../middleware/auth');
const isAllowed = require('../middleware/checkPermission');

orderRouter.get('/admin/get-orders', isAuth, orderController.Orders_get);
orderRouter.get('/admin/orders/:id', isAuth, orderController.getOrderById);
orderRouter.patch('/admin/order-status/:id', isAuth, orderController.updateOrderStatus);
orderRouter.get('/admin/orders', isAllowed, orderController.orders_page);

module.exports = orderRouter;