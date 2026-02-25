const Category = require('../models/category');

module.exports.categories = async (req, res) => {
    res.render('categories'); 
};

module.exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 }); 
    res.status(200).json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};


module.exports.createCategory = async (req, res) => {
  try {
    const { name, description} = req.body;
    const newCategory = new Category({ name, description });
    await newCategory.save();
    res.status(201).json({ success: true, data: newCategory });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports.updateCategory = async (req, res) => {
  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCategory) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, data: updatedCategory });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findById(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Category not found' });

    if (deleted.itemCount > 0) {
        return res.status(400).json({ message: 'Cannot delete category with existing items' });
    }
    else {
        await deleted.deleteOne();
    }

    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting category' });
  }
};

module.exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching category' });
  }
};