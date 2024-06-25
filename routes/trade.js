const router = require("express").Router();
const multer = require("multer");

const upload = multer({
    dest: 'uploads/',
    fileFilter: function (req, file, cb) {
        file.mimetype === 'text/csv' ? cb(null, true) : cb(null, false)
    }
});

router.post("/parse", upload.single('file'), async (req, res) => {
    
});

module.exports = router;