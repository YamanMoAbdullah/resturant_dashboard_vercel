const express = require('express');
const authRouter = express.Router();
const authController = require('../adminControllers/authController');
const isAuth = require('../middleware/auth');

authRouter.get('/admin/login', authController.login);
authRouter.post('/admin/login', authController.post_login);
authRouter.post('/admin/create-user', authController.createUser);
authRouter.patch('/admin/update-user/:id', isAuth, authController.updateUser);
authRouter.get('/admin/current-user', isAuth, authController.current_user);
authRouter.get('/admin/get-users', isAuth, authController.getUsers);
authRouter.delete('/admin/delete-user/:id', isAuth, authController.deleteUser);
authRouter.post('/admin/refresh-token', authController.refresh_token_post);
authRouter.post('/admin/logout', isAuth, authController.logout_post);

module.exports = authRouter;