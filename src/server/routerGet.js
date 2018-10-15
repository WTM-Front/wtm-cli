const test= require("./swaggerDoc.json")
const serve = require('koa-static');
module.exports = function (router) {
    /**
     * 初始化项目信息
     */
    router.get('/server/init', async (ctx, next) => {
        try {
            await this.componentCreate.init()
            ctx.body = {
                code: 200,
                data: {
                    contextRoot: this.componentCreate.contextRoot,
                    // componentName: this.componentCreate.componentName,
                    containersPath: this.componentCreate.containersPath,
                    subMenuPath: this.componentCreate.subMenuPath,
                    templates: this.componentCreate.templates,
                    wtmfrontConfig:this.componentCreate.wtmfrontConfig
                },
                message: `init 成功`
            };
        } catch (error) {
            ctx.body = {
                code: 500,
                data: false,
                message: error
            };
        }
    });
    router.get('/server/containers', (ctx, next) => {
        try {
            ctx.body = {
                code: 200,
                data: this.componentCreate.getContainersDir().map(x => {
                    return {
                        name: x,
                        component: x
                    }
                }),
                message: `create 成功`
            };
        } catch (error) {
            ctx.body = {
                code: 500,
                data: false,
                message: error
            };
        }
    });
    router.get('/api-docs', (ctx, next) => {
        try {
            ctx.body = test
        } catch (error) {
            ctx.body = {
                code: 200,
                data: false,
                message: error
            };
        }
    });
}