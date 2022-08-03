const express = require('express');
const router = express.Router();
const { signin } = require('../Controller/admin/admin');

router.post("/signin", signin);

module.exports = router;