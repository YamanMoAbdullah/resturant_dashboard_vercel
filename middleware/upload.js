const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, path.join(__dirname, '../images'));
    },
    filename: function (req, file, cb){
        cb(null, file.originalname);
    }
});

function setFilter(req, file, cb) {
    const fileTypes = /jpeg|jpg|png|webp|gif/;
    if (fileTypes.test(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('The type of image is not allowed'));
    }
}

const upload = multer({
    storage,
    fileFilter: setFilter,
    limits: { fileSize: 5 * 1024 * 1024},
});

module.exports = upload;