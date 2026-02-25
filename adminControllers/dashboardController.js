const User = require('../models/user');
const Order = require('../models/order');
const MenuItem = require('../models/menu_item');

module.exports.dashboard = async (req, res) => {
    res.render('dashboard');
};

module.exports.get_stats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalOrdersToday = await Order.countDocuments( { createdAt: { $gte: today } });

        const ordersToday = await Order.find( { createdAt: { $gte: today} } );
        const totalRevenue = ordersToday.reduce( (sum, current) => sum + current.total_price, 0);

        const totalMenuItems = await MenuItem.countDocuments();

         const totalCustomers = await User.countDocuments({ role: "user" });

         res.status(200).json( {
            totalOrdersToday,
            totalRevenue,
            totalMenuItems,
            totalCustomers
         });
    }
    catch (err) {
        res.status(500).json( { message: "Server error" } );
    }
}