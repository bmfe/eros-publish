### Eros Pub

eros 构建 app 请求差分包更新的后端逻辑.

### 原理
writing...

### env
首先请验证您的环境：

* linux best
* node > 7.x.x
* mongoDB > v3.4.9

### 依赖
此项目需要搭配着 eros 其他项目来使用:

* [eros-cli](https://github.com/bmfe/eros-cli) 
* [eros-template](https://github.com/bmfe/eros-template) 
 
### client 
客户端，基于 nuxt 服务器端渲染，可以扩展相关的更新页面 （目前还没写页面）, 可以根据自己的业务自行拓展。

``` 
cd client
npm install
npm run dev （开发）
```
开发默认监听3000端口
其他指令请看 client/package.json

### server 
> 服务端，基于 express，目前已经有简易的更新逻辑

首先需要根据业务修改**链接的数据库和监听的端口**:
    
    /server/app.js
    mongoose.connect("mongodb://localhost:27017/app");
    app.set("port", process.env.PORT || 3001);
然后修改 [eros-template](https://github.com/bmfe/eros-template) 中的 `config/eros.dev.json`:

```javascript
"diff": {
    "pwd": "/Users/yangmingzhe/Work/opensource/eros-diff-folder",
    "proxy": "http://localhost:8080/diff/eros-demo/"
}
```
* **diff.pwd** 是你全量包存放的绝对路径，可以是服务器地址，也可以是本地，所有基于 eros 构建的 app 发布生产环境的时候都会把 app 名称作为 `diff.zip` 的子目录，把所有全量包存放到这个子目录下。
    * **app名称是 config/eros.native.appName ,这个目录是自动帮您创建的，所以同名app会打到一起, 一定要注意**。
* **diff.proxy** 是你当前 eros 项目 生成的 dist 资源能通过代理设置，能让 url 访问的地址，目的是为了告诉 eros-app 下载差分包和全量包。

修改 [eros-template](https://github.com/bmfe/eros-template) 中的 `config/eros.native.json`，告诉客户端去请求那个更新接口：

```javascript
"url": {
    "bundleUpdate": "http://localhosts:3001/app/check"
}
```
默认是起本地3001端口，根据业务自行修改域名端口，后面路径不用变。

### MODEL
collection: 

```javascript
var modelSchema = new mongoose.Schema({
    appName: { type: String, require: true },
    jsPath: { type: String, require: true },
    iOS: { type: String, require: true },
    android: { type: String, require: true },
    jsVersion: { type: String, require: true },
    timestamp: {type: Number, require: true },
    createTime: {type: String, default: moment().format('YYYY-MM-DD h:m:s')}
})
```

### 接口
* 发布列表
    * path: `/app/list`
    * method: `GET`
    * params: 
        * appName: app名称
* 增加发布记录
    * path: `/app/add`
    * method: `POST`
     * params: 
        * appName: { type: **String**, require: **true**, desc: **"app 名称"**},
        * jsPath: { type: **String**, require: **true**, desc: **"js bundle 下载路径，也就是 eros.dev.js 中的 diff.proxy"**},
        * iOS: { type: **String**, require: **true**, desc: **"ios 版本号"**},
        * android: { type: **String**, require: **true**, desc: **"android 版本号"**},
        * jsVersion: { type: **String**, require: **true**, desc: **"当前 bundle 的 md5 值"**},
        * timestamp: {type: **Number**, require: **true**, desc: **"单当前包生成的时间**"}
* 检查是否更新
    * path: `/app/check`
    * method: `POST`
    * params: 
        * appName: { type: **String**, require: **true**, desc: **"app 名称"**},
        * jsPath: { type: **String**, require: **true**, desc: **"js bundle 下载路径，也就是 eros.dev.js 中的 diff.proxy"**},
        * iOS: { type: **String**, require: **true**, desc: **"ios 版本号"**},
        * android: { type: **String**, require: **true**, desc: **"android 版本号"**},
        * jsVersion: { type: **String**, require: **true**, desc: **"当前 bundle 的 md5 值"**}

`/app/check`中 ios 和 android 二选一。
        

### 部署
请下载并使用 `pm2`。

```
pm2 start app.js
```

### 开发
> 可以下载 supervisor 来帮助我们进行开发。

开启数据库:

```
mongod
```
node 开发服务:

```
cd server
npm install
supervisor app.js
```
