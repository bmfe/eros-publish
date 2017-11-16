"use strict"

var express = require("express");
var router = express.Router();
var Controllers = require('./controllers');

// router.use((req, res, next) => {
//     res.locals.currentUser = req.user;
//     res.locals.errors = req.flash("error");
//     res.locals.infos = req.flash("info");
//     next();
// });

// router.get("/", (req, res, next)=>{
//     Model.find()
//         .sort({ createdAt: "descending" })
//         .exec((err, users) => {
//             if (err) { return next(err); }
//             res.render("index", { users: users });
//         });
// });


router.post("/app/add", Controllers.app.add);
router.get("/app/list", Controllers.app.list);
router.get("/app/check", Controllers.app.check);


module.exports = router;