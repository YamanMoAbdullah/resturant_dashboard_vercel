const express = require('express');
const menuItemRouter = express.Router();
const menuItemController = require('../adminControllers/menuItemController');
const upload = require('../middleware/upload');
const isAuth = require('../middleware/auth');
const isAllowed = require('../middleware/checkPermission');

menuItemRouter.get('/admin/menu-items', isAllowed, menuItemController.menu_items);
menuItemRouter.post('/admin/menu-items/create', isAuth, upload.single('image'), menuItemController.create_menu_item);
menuItemRouter.get('/admin/get-menu-items', isAuth, menuItemController.getAllMenuItems_get);
menuItemRouter.patch('/admin/menu-items/update/:id', isAuth, upload.single('image'), menuItemController.updateMenuItem_patch);
menuItemRouter.delete('/admin/delete-menu-item/:id', isAuth, menuItemController.deleteMenuItem_delete);

module.exports = menuItemRouter;