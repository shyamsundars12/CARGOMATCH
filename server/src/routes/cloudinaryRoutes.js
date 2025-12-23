const router = require('express').Router();
const controller = require('../controllers/cloudinaryController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Make Cloudinary file public - requires authentication
router.post('/make-public', verifyToken, controller.makeFilePublic);

module.exports = router;

