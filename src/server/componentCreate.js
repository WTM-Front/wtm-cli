const path = require("path");
const fs = require('fs-extra');
const ora = require('ora');
const templateServer = require('./templateServer/analysis');
const registerHelper = require('./templateServer/registerHelper');
const log = require('../lib/log');
module.exports = class {
    constructor(contextRoot) {
        // this.Generator = Generator;
        // this.fs = this.Generator.fs;
        // 项目根路径  
        // if (this.Generator.samProject.create) {
        //     // 首次创建项目追加目录名称
        //     this.contextRoot = path.join(this.Generator.contextRoot,this.Generator.options.appname);
        // } else {
        this.contextRoot = contextRoot;
        // }
        /**
         * 创建的组件名称
         */
        this.componentName = null;
        /**
         * 容器组件路径
         */
        this.containersPath = path.join(this.contextRoot, "src", "containers");
        /**
         * 路由路径
         */
        this.subMenuPath = path.join(this.contextRoot, "src", "app", "subMenu.json");
        /**
         * 模板路径
         */
        this.templatePath = path.join(__dirname, 'templateServer', "template");
        /**
         * 临时目录
         */
        this.temporaryPath = path.join(__dirname, 'templateServer', "temporary");
        /**
         * 项目配置文件路径
         */
        this.wtmfrontPath = path.join(this.contextRoot, "wtmfront.config.js");
        /**
         * 项目配置
         */
        this.wtmfrontConfig = {
            contextRoot: this.contextRoot
            // "type": "typescript",
            // "frame": "react",
            // "registerHelper": "wtmfront/registerHelper",
            // "template": "wtmfront/template",
            // "subMenu": "src/app/subMenu.json",
            // "containers": "src/containers",
        };
        /**
         * 模板文件列表
         */
        this.templates = [];
        /** 删除的列表 */
        this.deleteList = [];
        this.deleteTime = new Date().getTime();
        this.init();
    }
    /**
     * 初始化项目信息
     */
    init() {
        if (this.exists(this.wtmfrontPath)) {
            this.setWtmfrontConfig();
            this.deleteList = [];
        } else {
            log.error("没有找到 配置文件")
        }
    }
    /**
     * 注入模块
     */
    injection() {
        registerHelper(this.wtmfrontConfig);
        this.getTemplate();
    }
    /**
    * 初始化项目信息
    */
    setWtmfrontConfig() {
        const config = require(this.wtmfrontPath);
        let containersPath = this.containersPath;
        let subMenuPath = this.subMenuPath;
        try {
            containersPath = path.join(this.contextRoot, config.containers);
            subMenuPath = path.join(this.contextRoot, config.subMenu);
            this.containersPath = containersPath;
            this.subMenuPath = subMenuPath;
            this.wtmfrontConfig = Object.assign({}, this.wtmfrontConfig, config);
        } catch (error) {
            log.error(error);
            throw error;
        }
    }

    /**
     * 创建组件
     * @param {*} fsPath 
     */
    async create(components) {
        const spinner = ora('创建组件').start();
        try {
            // // 清空目录
            fs.emptyDirSync(this.temporaryPath);
            this.deleteList = [];
            // 创建成功的组件
            const successList = [];
            for (let index = 0, length = components.length; index < length; index++) {
                const component = components[index];
                try {
                    const fsPath = path.join(this.containersPath, component.componentName);
                    // 创建临时文件
                    const temporaryPath = path.join(this.temporaryPath, component.componentName);
                    // 模板服务
                    const analysis = new templateServer(temporaryPath);
                    this.mkdirSync(temporaryPath);
                    spinner.text = '创建 ' + component.componentName;
                    this.createTemporary(component.template, temporaryPath);
                    // 写入配置文件。
                    // spinner.text = 'Create pageConfig';
                    fs.writeJsonSync(path.join(temporaryPath, "pageConfig.json"), component, { spaces: 4 });
                    // spinner.text = 'analysis template';
                    await analysis.render();
                    successList.push(component);
                    // log.success("创建 " + component.componentName);
                    // 创建目录
                    this.mkdirSync(fsPath);
                    // 拷贝生成组件
                    this.copy(temporaryPath, fsPath);
                    // 删除临时文件
                    fs.removeSync(temporaryPath);
                } catch (error) {
                    log.error("创建失败 ", component.componentName);
                    log.error("error-", error);
                }
            }
            spinner.stop();
            // 写入路由
            this.writeRouters(successList, 'add');
            // 生成导出
            this.writeContainers();
            //  修改 页面配置 模型
            log.success("创建 ", successList.map(x => x.componentName).join(' / '));
            // spinner.text = 'writeRouters';
        } catch (error) {
            log.error("error", error);
            throw error
        } finally {
            // spinner.stop();
        }

    }
    /**
     * 创建临时目录
     * @param {*} template 模板名称
     * @param {*} temporaryPath  临时目录
     */
    createTemporary(template, temporaryPath) {
        if (template == null || template == "") {
            // template = "default";
            throw "没有找到模板文件"
        }
        // let templatePath = this.templatePath;
        let templatePath = path.join(this.contextRoot, this.wtmfrontConfig.template);
        // // 不是默认 模板 取 项目中的模板。
        // if (template != "default") {
        //     templatePath = path.join(this.contextRoot, this.wtmfrontConfig.template);
        // }
        // 拷贝模板文件 到临时目录 写入数据
        fs.copySync(path.join(templatePath, template), temporaryPath);
    }
    /**
     * 删除组件
     * @param {*} componentName 
     */
    delete(componentName) {
        try {
            // 防止操作太快。
            if (new Date().getTime() - this.deleteTime <= 3000) {
                throw "操作太快,请等待3秒后再试"
            }
            this.deleteTime = new Date().getTime();
            this.deleteList.push(componentName);
            this.writeContainers(componentName);
            this.writeRouters(componentName, 'delete');
            const conPath = path.join(this.containersPath, componentName)
            log.success("delete " + componentName);
            // setTimeout(() => {
            return fs.remove(conPath)
            // return new Promise((resole, reject) => {
            //     fsExtra.remove(conPath, error => {
            //         if (error) {
            //             // return reject(error)
            //         }
            //         setTimeout(() => {
            //             resole(true);
            //         }, 500);
            //     });
            // })
            // rimraf.sync(conPath);
            // }, 500);
        } catch (error) {
            log.error("delete ", error);
            throw error
        }
    }
    /**
     * 是否存在目录
     * @param {*} fsPath 
     */
    exists(fsPath) {
        const exists = fs.pathExistsSync(fsPath);
        // console.log("exists：" + fsPath, exists);
        return exists
    }
    /**
     * 创建目录
     * @param {*} fsPath 
     */
    mkdirSync(fsPath) {
        fs.ensureDirSync(fsPath);
        // console.log("mkdirSync");
    }
    /**
     * 拷贝文件
     * @param {*} from 
     * @param {*} to 
     */
    copy(from, to) {
        fs.copySync(from, to)
        // log.info("create", to);
    }
    /**
     * 获取路由配置 json
     */
    readJSON() {
        return fs.readJsonSync(this.subMenuPath);
    }
    guid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    /**
     * 写入路由  菜单
     * @param {*} components 
     */
    writeRouters(components, type = 'add') {
        if (this.exists(this.subMenuPath)) {
            // 读取路由json
            let routers = this.readJSON();
            if (type == 'add') {
                components.map(component => {
                    routers.subMenu.push({
                        "Key": component.key,//唯一标识
                        "Name": component.menuName,//菜单名称
                        "Icon": component.icon,//图标
                        "Path": `/${component.componentName}`,//路径
                        "Component": component.componentName,//组件
                        "Action": Object.keys(component.actions),//操作
                        "Children": []//子菜单
                    });
                })
            } else {
                // 删除
                const index = routers.subMenu.findIndex(x => x.Component == components);
                if (index != -1) {
                    routers.subMenu.splice(index, 1);
                }
                // console.log("index " + component, index);
            }
            // 写入json
            // editorFs.writeJSON(path.join(this.contextRoot, "src", "app", "a.json"), routers);
            fs.writeJsonSync(this.subMenuPath, routers, { spaces: 4 });
            // log.success("writeRouters " + type, JSON.stringify(components, null, 4));
        } else {
            log.error("没有找到对应的路由JSON文件");
        }
    }
    /**
     * 修改菜单
     */
    updateSubMenu(subMenu) {
        let routers = this.readJSON();
        routers.subMenu = subMenu;
        fs.writeJsonSync(this.subMenuPath, routers, { spaces: 4 });
        log.success("updateSubMenu ");
    }
    /**
     * 写入组件导出
     */
    writeContainers(componentName) {
        // 获取所有组件，空目录排除
        const containersDir = this.getContainersDir();
        let importList = containersDir.map(component => {
            return `${component}: () => import('./${component}').then(x => x.default)`
        });
        const conPath = path.join(this.containersPath, "index.ts")
        let conStr = fs.readFileSync(conPath).toString();
        conStr = conStr.replace(/(\/.*WTM.*\/)(\D*)(\/.*WTM.*\/)/, '/**WTM**/ \n    '
            + importList.join(",\n    ") +
            '\n    /**WTM**/')
        fs.writeFileSync(conPath, conStr);
        // log.success("writeContainers");
    }
    /**
     * 获取组件列表
     */
    getContainersDir() {
        return fs.readdirSync(this.containersPath).filter(x => {
            const pathStr = path.join(this.containersPath, x, "pageConfig.json");
            // console.log(pathStr, this.exists(pathStr));
            return !this.deleteList.some(del => del == x) && this.exists(pathStr)
            // return fs.statSync(pathStr).isDirectory() && this.exists(path.join(pathStr, "index.tsx"))
        })
    }
    /**
     * 获取模板列表
     */
    getTemplate() {
        // const template = ['default'];
        if (this.wtmfrontConfig.template) {
            const templatePath = path.join(this.contextRoot, this.wtmfrontConfig.template);
            fs.readdirSync(templatePath).filter(x => {
                if (fs.statSync(path.join(templatePath, x)).isDirectory()) {
                    this.templates.push(x);
                }
            })
        }
        // return template;
    }
}