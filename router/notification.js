const express = require('express'); 
const { addNotification, getNotification, editNotification, deleteNotification, addNews, getNews, deleteNews } = require('../Controller/notification');
const router = express.Router();


router.post("/addNotification", addNotification);
router.get("/getNotification", getNotification);
router.post("/editNotification", editNotification);
router.post("/deleteNotification", deleteNotification);
router.post("/addNews", addNews);
router.get("/getNews", getNews);
router.post("/deleteNews", deleteNews);






module.exports = router;