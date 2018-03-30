const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const routes = require("./routes");
const app = express();
const EROS_OPTIONS = require('./config')

mongoose.connect(EROS_OPTIONS.db);
app.use(EROS_OPTIONS.staticVirtualPath, express.static(EROS_OPTIONS.staticRealPath))
app.set("port", process.env.PORT || EROS_OPTIONS.defaultPort);

// 提高安全性
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(flash());
app.use(routes);

app.listen(app.get("port"), function() {
    console.log("Server started on port " + app.get("port"));
});