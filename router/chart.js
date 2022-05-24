const express = require('express');
const { config, marks, study_templates, time, symbols, charthistory, symbol_info, timescale_marks } = require('../Controller/chart');
const router = express.Router();
router.get("/chart/config", config);
router.get("/chart/marks", marks);
router.get("/chart/study_templates", study_templates);
router.get("/chart/time", time);
router.get("/chart/symbols", symbols);
router.get("/chart/history", charthistory);
router.get("/chart/symbol_info", symbol_info);
router.get("/chart/timescale_marks", timescale_marks);


module.exports = router;