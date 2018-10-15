module.exports = function (router) {
    /**
     * 创建组件
     */
    router.post('/server/create', async (ctx, next) => {
        // const data = await create(ctx.request.body, this.Generator.contextRoot)
        try {

            await this.componentCreate.create(ctx.request.body)
            ctx.body = {
                code: 200,
                data: true,
                message: `create 成功`
            };
            // console.log("create",ctx.request.body);
        } catch (error) {
            ctx.body = {
                code: 500,
                data: false,
                message: error
            };
        }
    });
    /**
     * 删除
     */
    router.post('/server/delete', async (ctx, next) => {
        // const data = await create(ctx.request.body, this.Generator.contextRoot)
        try {
            this.componentCreate.delete(ctx.request.body.containersName)
            ctx.body = {
                code: 200,
                data: true,
                message: `delete 成功`
            };
        } catch (error) {
            ctx.body = {
                code: 500,
                data: false,
                message: error
            };
        }
    });
    /**
        * 修改菜单
        */
    router.post('/server/updateSubMenu', async (ctx, next) => {
        // const data = await create(ctx.request.body, this.Generator.contextRoot)
        try {
            this.componentCreate.updateSubMenu(ctx.request.body)
            ctx.body = {
                code: 200,
                data: true,
                message: `delete 成功`
            };
        } catch (error) {
            ctx.body = {
                code: 500,
                data: false,
                message: error
            };
        }
    });


}