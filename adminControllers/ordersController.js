const Order = require('../models/order');
const OrderItems = require('../models/order_item');
const User = require('../models/user');

module.exports.Orders_get = async (req, res) => {
  try {
    
    const orders = await Order.find()
      .sort({ createdAt: -1 }) 
      .populate('user_id', 'name') 

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItems.find({ order_id: order._id })
          .populate('menu_item_id', 'name price');

        return {
          _id: order._id,
          user: order.user_id, 
          total_price: order.total_price,
          status: order.status,
          createdAt: order.createdAt,
          items: items.map(item => ({
            _id: item._id,
            menu_item: item.menu_item_id, 
            quantity: item.quantity,
            unit_price: item.unit_price
          }))
        };
      })
    );

    res.status(200).json({
      message: 'All orders fetched successfully',
      orders: ordersWithItems
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
};

module.exports.getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const itemsOrder = await OrderItems.find({ order_id: orderId });
        res.status(200).json({ order, itemsOrder });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

module.exports.updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    const allowedStatusOrder = ['pending', 'shipped', 'delivered', 'cancelled', 'processing'];
    if (!allowedStatusOrder.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        order.status = status;
        await order.save();
        res.status(200).json({ message: 'Status updated', order });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

module.exports.orders_page = async (req, res) => {
    res.render('orders');
};