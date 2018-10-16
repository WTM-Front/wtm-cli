const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const staticServer = require("koa-static");
const path = require('path');
const opn = require('opn');
const proxy = require('koa2-simple-proxy');
const componentCreate = require('./componentCreate');
const routerGets = require('./routerGet');
const routerPost = require('./routerPost');
const log = require('../lib/log');
const app = new Koa();
const router = new Router();
module.exports = class {
  constructor(contextRoot) {
    this.contextRoot = contextRoot;
    this.componentCreate = new componentCreate(contextRoot);
  }
  init(port = 8765) {
    this.router();
    const swaggerDoc = this.componentCreate.wtmfrontConfig.swaggerDoc;
    if (swaggerDoc == null || swaggerDoc == "") {
      return log.error("请配置 swaggerDoc")
    }
    this.use();
    app.listen(port, null, null, () => {
      const loct = `http://localhost:${port}`;
      log.success('模板服务已启动', loct);
      log.success("swaggerDoc", swaggerDoc);
      opn(loct);
    });

  }
  router() {
    this.get();
    this.post();
  }
  get() {
    routerGets.call(this, router)
  }
  post() {
    routerPost.call(this, router);
  }
  use() {
    // Access-Control-Allow-Headers=‘json’
    const swaggerDoc = this.componentCreate.wtmfrontConfig.swaggerDoc;
    app
      // .use(cors())
      .use(bodyParser())
      .use(proxy('/swaggerDoc', swaggerDoc))
      .use(staticServer(path.join(this.contextRoot, "wtmfront", "swagger", "dist")))
      // .use(proxy(this.componentCreate.wtmfrontConfig.swaggerDoc))
      .use(router.routes())
      .use(router.allowedMethods());
  }
}