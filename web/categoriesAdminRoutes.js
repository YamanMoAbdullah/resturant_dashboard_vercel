const express = require('express');
const categoriesRouter = express.Router();
const categoriesController = require('../adminControllers/categoriesController');
const isAuth = require('../middleware/auth');
const isAllowed = require('../middleware/checkPermission');

categoriesRouter.get('/admin/categories', isAllowed, categoriesController.categories);
categoriesRouter.get('/admin/get-categories', isAuth, categoriesController.getAllCategories);
categoriesRouter.post('/admin/create-category', isAuth, categoriesController.createCategory);
categoriesRouter.patch('/admin/update-category/:id', isAuth, categoriesController.updateCategory);
categoriesRouter.delete('/admin/delete-category/:id', isAuth, categoriesController.deleteCategory);
categoriesRouter.get('/admin/get-category/:id', isAuth, categoriesController.getCategoryById);

module.exports = categoriesRouter;