var mongoose = require("mongoose"),
    moment = require("moment")
var modelSchema = new mongoose.Schema({
    appName: { type: String, require: true },
    jsPath: { type: String, require: true },
    iOS: { type: String, require: true },
    android: { type: String, require: true },
    jsVersion: { type: String, require: true },
    timestamp: {type: Number, require: true },
    createTime: {type: String, default: moment().format('YYYY-MM-DD h:m:s')}
})

modelSchema.methods.findbyAppName = (appName, callback) => {
    this.model('app').find({ appName }, callback)
}

var AppModel = mongoose.model("app", modelSchema)
module.exports = AppModel