const notifications = require("../models/notifications");
const News = require("../models/news");

async function addNotification(req, res) {
  try {
    const banner = await uploadImage(req.files.banner, "banner_" + Date.now());
    new notifications({ ...req.body, banner }).save((error, notification) => {
      if (error){ 
        console.log("Error :", error);
      }else{
      res.status(200).json({ message: "Notification added successfully.", notification });
    }
  })
  } catch (error) {
    console.log("error from: addNotification", error.message);
    res.status(400).json({ message: "Somthing went wrong" });
  }
}

async function getNotification(req, res) {
  try {
    notifications.find(req.query).exec((error, notifications) => {
      if (error){
       return res.status(400).json({ message: error.message });
      }else{
      return res.status(200).json(notifications);
      }
    });
  } catch (error) {
    console.log("error from: ", error.message);
    return res.status(400).json({ message: error.message });
  }
}

async function editNotification(req, res) {
  try {
    const banner = req.files && req.files.banner ? await uploadImage(req.files.banner, "banner_" + Date.now()) : "";
    notifications.updateOne({ _id: req.body.id }, { $set: { description: req.body.description, banner: banner, }, })
      .then((error, notification) => {
        if (error){
           console.log("Error :", error);
        }else{
        res.status(200).json({
          message: "Notification updated successfully.",
          notification,
        });
      }
      });
  } catch (error) {
    console.log("error from: editNotification", error.message);
    res.status(400).json({ message: "Somthing went wrong" });
  }
}

async function deleteNotification(req, res) {
  try {
    notifications.findOneAndDelete({ _id: req.body.id }).then((notification, error) => {
        if (error){
           res.status(400).json({ message: error.message });
        }else{
        res.status(200).json(notification);
        }
      });
  } catch (error) {
    console.log("error from: deleteNotification", error.message);
    res.status(400).json({ message: "Somthing went wrong" });
  }
}

async function addNews(req, res) {
  try {
    new News(req.body).save((error, news) => {
      if (error){
      console.log("Error :", error);
      }else{
      res.status(200).json({ message: "news added successfully.", news });
      }
    });
  } catch (error) {
    console.log("error from: addNews", error.message);
    res.status(400).json({ message: "Somthing went wrong" });
  }
}

async function getNews(req, res) {
  try {
    News.find(req.query).exec((error, News) => {
      if (error){
       return res.status(400).json({ 
         status : 0,
         message: error.message
         });
      }else{
      return res.status(200).json(News);
      }
    });
  } catch (error) {
    console.log("error from: ", error.message);
    return res.status(400).json({ message: error.message });
  }
}

async function editNews(req, res) {
    try {
        News.updateOne({ _id: req.body.id },{ $set: { description: req.body.description, title: req.body.title }}).then((error, news) =>{
          if (error){
             console.log("Error :", error);
          }else{
          res.status(200).json({
            message: "Notification updated successfully.",
            news,
          });
        }
        });
    } catch (error) {
      console.log("error from: editNews", error.message);
      res.status(400).json({ message: "Somthing went wrong" });
    }
}

async function deleteNews(req, res) {
  try {
    News.findOneAndDelete({ _id: req.body.id }).then((News, error) => {
      if (error){
         res.status(400).json({ message: error.message });
      }else{
      res.status(200).json(News);
      }
    });
  } catch (error) {
    console.log("error from: deleteNews", error.message);
    res.status(400).json({ message: "Somthing went wrong" });
  }
}

async function uploadImage(data_stream, file_name) {
  const mime = require("mime");
  const fs = require("fs");
  try {
    var decodedImg = data_stream;
    var imageBuffer = decodedImg.data;
    var type = decodedImg.mimetype;
    var extension = mime.getExtension(type);
    const newname = file_name.split("/").join("");
    var fileName = newname + "-image." + extension;

    try {
      fs.writeFileSync("./uploads/images/" + fileName, imageBuffer, "utf8");
    } catch (err) {
      console.log("Error: in file upload: ", err.message);
      return undefined;
    }
    const file_path = `/images/${fileName}`;
    return file_path;
  } catch (error) {
    console.log("Error in file upload: bankDetail >> uploadImage", error);
    return undefined;
  }
}

module.exports = {
  addNotification,
  getNotification,
  editNotification,
  deleteNotification,
  addNews,
  getNews,
  deleteNews,
  editNews
};
