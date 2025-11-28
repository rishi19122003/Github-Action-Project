const express = require('express');
const { getActiveResellers } = require('../controllers/publicController');

const router = express.Router();

// Public endpoint - no authentication required
router.get('/resellers', getActiveResellers);

module.exports = router;
