require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db'); 
const menuItemsAdminRouter = require('./web/menuItemsAdminRoutes');
const categoriesAdminRouter = require('./web/categoriesAdminRoutes');
const orderAdminRouter = require('./web/ordersAdminRoutes');
const userAdminRoutes = require('./web/usersAdminRoutes');
const authRoutes = require('./web/authRoutes');
const dashboardRouter = require('./web/dashboardAdminRoutes');

const app = express();

/* Middlewares */
app.use(express.json());
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

/* Routes */
app.use(menuItemsAdminRouter);
app.use(categoriesAdminRouter);
app.use(orderAdminRouter);
app.use(userAdminRoutes);
app.use(authRoutes);
app.use(dashboardRouter);

/* DB */
connectDB();

/* ===== Local Only ===== */
if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => {
        console.log("Server running on http://localhost:3000");
    });
}
/* ===== Route أساسي / ===== */
app.get('/', (req, res) => {
    res.send("Server is running!");
});
/* ===== Export for Vercel ===== */
module.exports = app;