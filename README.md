>时间就是金钱，热更新能避免 appStore 的审核，为 app 迭代提供强大动力。

## 开始之前
本章内容会与开发者一起在`本地构建热更新服务`，开始本章内容前，请再次确保您已经运行起 eros 开发的整套流程，**如果需要构建到服务端/自动构建平台上，我们建议您先了解一些后端基础，在尝试构建 `热更新`**。

## 原理
[文档.](https://bmfe.github.io/eros-docs/#/zh-cn/advanced_diff)

## eros 为什么要做自己的热更新？
如果您之前熟读了我们的[入门指南](https://bmfe.github.io/eros-docs/#/zh-cn/tutorial_newcomer)，大概就理解为什么 eros 要做`内置包热更新`，这里在列举一下。

**相对于 weex 每次都走线上请求最新的 bundle，我们做内置包的设计是考虑到如下场景：**

1.发布了新页面。

- weex 场景：新的页面，不做自身缓存策略的话，会加载远端的 bundle，首次加载会很慢，这样页面就会出来的比较慢。
- eros 场景：客户在使用中还是访问老的页面，下次进入 app 更新访问新的，每次从本地读取 bundle，很快。

2.bundle 打包体积。

- weex 场景：weex 推荐多页面，所以每个页面都是个 bundle，意味着使用时候如果不做特殊处理，按需引入，每个 bundle 会有很多重复的冗余代码，尽管 weex 相比 rn，bundle 的体积已经小很多了。
- eros 场景：weex 在本地有一个公共的 js bundle (appboard)，我们把公共逻辑都放入这里，每次打包都打一份代码，并把公共代码在客户端来进行拼接这行，虽然这样不太规范，**但这样的方式使我们的 bundle 大小减少了 60% +，100 多个页面，内置包大小仅仅为 2MB**。

3.用户在挂号这条业务线中走到了支付这一步，挂号流程改造，支付的时候多加了些参数。

- weex 场景：发布了新的版本，如果没有做好自身的缓存兼容逻辑，支付页面跳转了新的页面，前端就每次都需要考虑兼容版本之间兼容。
- eros 场景：客户端本地更新了最新的内置包，不会立即更新，用户完成此次 app 使用，下次进入 app 时才会提示更新。

4...

我们还能列出许多相似的场景，不难看出，内置包热更新的设计，更适于纯 weex native 的项目。

## 模拟 EROS 热更新
### 环境
- node > 7.x.x
- mongoDB > v3.4.9

### 工具
- supervisor 开发
- pm2 部署
- Robo 3T (mongoDB 可视化工具)

安装都比较简单，装到全局即可，不过多赘述。

### clone 项目
```
$ git clone https://github.com/bmfe/eros-publish.git
$ cd eros-publish/server
$ npm i
```
### 修改配置
```
// eros-publish/server/config.js
module.exports = {
    db:'mongodb://localhost:27017/app',
    defaultPort: 3001,
    staticVirtualPath: '/static',
    staticRealPath: '/Users/yangmingzhe/Work/opensource/',
    
    zipReturn: 'diff'
}
```
- `db`: 数据库服务地址
- `defaultPort`: 热更新服务默认端口
- `staticVirtualPath`: 静态虚拟地址
- `staticRealPath`: 静态真实地址
- `zipReturn`: 返回包的开关，`full` 是任何情况下都返回`全量包`， `diff` 则是任何情况下都返回`增量包`

这里说下 `staticVirtualPath` 和 `staticRealPath`，拿上面例子来说，访问虚拟地址 ('/static') ，其实是访问的真实地址 ('/Users/yangmingzhe/Work/opensource/') 下的资源。

> http://localhost:3001/static => /Users/yangmingzhe/Work/opensource/

所以当我们把自己的项目放到 opensource 下，就可以让别人通过`/static` 访问到你项目中的打包生成好的资源文件 `(dist)`。
### 开发调试

- 开启数据库:
权限不足用sudo
```
$ mongod
```

- 打开 `Robo 3T` 可视化工具：

这时候会提示你链接到你的数据库，链接即可。

- 运行后端服务
```
$ supervisor app.js
```
看到如下界面后:

后端已经调通了。

### 接口
总共就 3 个接口，需要我们先熟悉一下：
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

### 修改模板配置
1. 这里我们重新生成了一个名叫 eros-demo 的默认项目，在本地 `/Users/yangmingzhe/Work/opensource/` 绝对路径下，注意这个就是我上面填写的 `staticRealPath`。
2. 修改 eros.native.js 中的 `url.bundleUpdate`，由上面的接口我们能知道，需要 app 进行更新检测的接口是 `/app/check`，所以我们填写 `http://localhost:3001/app/check`即可
3. 修改 eros.dev.js 中的 diff 对象
    * `pwd`: 每次更新的全量包我们都存放到这个地址，这样每次差分包的生成都会遍历这个路径下的全量包生成，建议无论是在本地还是在服务器上，都先建好这个目录，我这里写我本地的路径一个新建的目录`/Users/yangmingzhe/Work/opensource/eros-diff-folder`
    * `proxy`: 能被用户访问到的路径，由于上面我们配置了 `staticVirtualPath`，这样我们就能在 `http://localhost:3001/static/` 访问到我们的 eros-demo 项目资源，填写路径为 `http://localhost:3001/static/eros-demo/dist/js/`

### 模拟更新
这里需要用到两条指令：
- `$ eros pack -s url`: 构建全量包，内置到两端成为内置包，并将包信息发送 eros-publish 来记录。
- `$ eros build -s url -d`: 构建最新全量包，遍历 eros.dev.js 下 diff.pwd 历史版本分别生成差分包，并将全量包信息发送服务器

> 差分包 v1-v2 = md5(全量包 v1 md5 + 全量包 v2 md5)

首先我们构建模拟 iOS app v1.0.0 首次发版情况。
1. 修改业务代码，模拟我们 1.0.0 的功能，添加首页加一行代码：
```
<text class="desc-info-2">版本 1.0.0</text>
```

2. 修改 app 版本号为 1.0.0，[iOS 修改方法](https://bmfe.github.io/eros-docs/#/zh-cn/ios_config)。
3. 修改 `eros.native.json` 里的 `version.iOS` 为 1.0.0。
4. 执行 `$ eros pack -s http://localhost:3001/app/add`，打内置包，并记录此版本全量包信息。
5. 正式流程这步就可以提交 appStore 审核了，不过本地调试可以忽略此步。
6. 运行你的 app，关闭拦截器读取内置包，模拟用户，可以看到首页的 `版本 1.0.0`。
7. 我们修改本地的代码，如把首页文案变动一下 `版本 1.0.0-build.1`。
8. 执行 `$ eros build -s http://localhost:3001/app/add -d` 来生成差分包。
9. 重启 app，你就会发现 app 会弹出更新提示，点击立即更新即可看到文案变更为 `版本 1.0.0-build.1`。

至此我们就完成了一次 app 的发布，也就是`热更新`。

下面会有同学问，当我 app 逻辑做了变动，升级到了 1.0.1 怎么办呢？

> 只要理解，**我们每次 app 发版都内置最新的 js bundles 给用户**就行了，继续以上步骤，app 版本和 js 版本都变为 1.0.1 就完成了一次跨版本升级。

## 部署 EROS 热更新
部署只需要启动数据库，然后通过 `pm2/nohup` 来部署即可，注意写好上面涉及到的配置。
```
$ sudo nohup mongod &      // 后台运行数据库
$ sudo pm2 start app.js    // 后台 node 服务
```

## 最后
eros-publish 是一个非常简单热更新服务逻辑，热更新发布最重要的还是要把脚手架和发布系统结合好，eros-publish 虽然是开箱即用，但有一些不足和改进的方向这里也要提一下：

- 可以在 app 内置 websocket 与发布系统的 websocket，来实现定时定点，分区分片的更新推送，保证 app 可以进行灰度发布，更有甚者，可以按照用户习性来推送不同版本的全量包。
- 更新的逻辑应该更多样化，分为强制更新，非强制更新，更新说明推送等。
- 当更新包比较大的时候应该考虑断点续传，文件校验性的逻辑，不过以我们一百多个页面的 app 来说，整个全量包也才 2M 多。

