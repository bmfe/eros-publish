var AppModel =  require("../models/app"),
    format =  require("../utils/tool").format,
    md5 = require('js-md5'),
    config = require('../config')


const add = (req, res, next) => {
    let appInfo = new AppModel(req.body)

    appInfo.save(() => {
        res.send(format({
            data: 'success'
        }))            
    })
}

const list = (req, res, next) => {
    let { appName } = req.query
    
    AppModel.find({ appName }).sort({ _id : 'desc'}).exec((err, app) =>{
        if (err) { return next(err) }
        if (!app) { return next(404) }
        res.send(format({
            data: app
        }))
    })
}

const check = (req, res, next) => {
    let { appName, jsVersion, isDiff = true } = req.query,
        platform = !!req.query.iOS ? 'iOS': 'android',
        version = req.query[platform],
        checkParams = {
            appName,
        }
    if(jsVersion) checkParams['jsVersion'] = jsVersion
    checkParams[platform] = version
    AppModel.find(checkParams, (err, apps) =>{
        if (err) { return next(err) }
        requestZip({
            res, apps, appName, platform, version, jsVersion, isDiff, next
        })
    })
}

const requestZip = ({res, apps, appName, platform, version, jsVersion, isDiff, next}) => {
    if(!appName || !platform || !version) {
        res.send(format({
            resCode: 400,
            msg: "参数缺失",
            data: {}
        }))   
        return         
    }
    getNewestInfo({ appName, platform, version}).then(newests => {
        // console.log(newests)
        if (!newests || !newests.length) { 
            res.send(format({
                resCode: 400,
                msg: "无任何包信息",
                data: {}
            }))             
            return 
        }

        const fullZipPath = `${newests[0].jsPath}${newests[0].jsVersion}.zip`
        const diffZipPath = `${newests[0].jsPath}${md5(jsVersion + newests[0].jsVersion)}.zip`

        if(isDiff == 0 || isDiff === 'false' || isDiff === false) {
            // 请求全量包
            res.send(format({
                msg: "请求全量包成功",
                data: {
                    diff: false,
                    path: fullZipPath
                }
            }))             
            return
        }
        // 请求差分包
        if(!apps.length){
            // 不存在jsVersion 当前包信息可能被篡改 直接返回最新版本全量包
                res.send(format({
                    resCode:  401,
                    msg: "jsVersion 不存在",
                    data: {
                        diff: false,
                        path: fullZipPath
                    }
                }))                    
        }else {
            if(newests[0].jsVersion === jsVersion) {
                // 存在 jsVersion 并且是最新
                res.send(format({
                    resCode: 4000,
                    msg: "当前版本已是最新，不需要更新"
                }))                 
            } else {
                // 存在 jsVersion 但不是最新
                res.send(format({
                    msg: "当前版本需要更新",
                    data: {
                        diff: true,
                        jsVersion: newests[0].jsVersion,
                        // path: `${newests[0].jsPath}${md5(jsVersion + newests[0].jsVersion)}.zip`
                        path: config.zipReturn === 'diff' ? diffZipPath : fullZipPath
                    }
                }))                 
            }

        }    
    })
}

const getNewestInfo = ({appName, platform, version}) => {
    let params = {
        appName
    }
    params[platform] = version
    return AppModel.find(params).sort({ timestamp : 'desc'})
       

}



module.exports = {
    add,
    list,
    check
}