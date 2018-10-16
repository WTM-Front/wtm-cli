
const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const inquirer = require('inquirer')
const semver = require('semver')
const child_process = require('child_process')
const download = require("./lib/download")
const log = require("./lib/log")
class Update {
    constructor(options) {
        const unSupportedVer = semver.lt(process.version, 'v7.6.0')
        if (unSupportedVer) {
            throw new Error('Node.js 版本过低，推荐升级 Node.js 至 v8.0.0+')
        }
        this.rootPath = process.cwd();
        this.options = Object.assign({
            modular: null,
        }, options)
    }
    /**
     * 初始化参数
     */
    init() {
        const prompts = []
        const options = this.options
        // 模板
        const modulars = [{
            name: 'swagger',
            value: 'swagger'
        }, {
            name: 'table',
            value: 'table'
        }, {
            name: 'all',
            value: 'all'
        }]
        if (typeof options.modular !== 'string') {
            prompts.push({
                type: 'list',
                name: 'modular',
                message: '请需要更新的模块',
                choices: modulars
            })
        } else {
            let isModulars = false
            modulars.forEach(item => {
                if (item.value === options.modular) {
                    isModulars = true
                }
            })
            if (!isModulars) {
                log.error('你选择的模块不存在')
                log.info('目前提供了以下模块以供使用:')
                console.log()
                modulars.forEach(item => {
                    console.log(chalk.green(`- ${item.name}`))
                })
                process.exit(1)
            }
        }
        return inquirer.prompt(prompts)
    }
    /**
     * 创建项目
     */
    async create() {
        let prompts = await this.init();
        prompts = Object.assign(this.options, prompts);
        // console.log(prompts);
        switch (prompts.modular) {
            case 'swagger':
                await this.downloadSwagger();
                break;

            default:
                break;
        }
        return true;
    }
    /**
    * 下载解析模块
    */
    async downloadSwagger(prompts) {
        let url = "WTM-Front/wtm-swagger";
        const projectPath = path.join(this.rootPath, "wtmfront", "swagger");
        return await download(url, projectPath, {
            start: "更新 Swagger 解析组件",
            error: "Swagger 解析组件 更新败 请手动执行 wtm update swagger",
            success: "Swagger 解析组件 更新完成",
        })
    }
    /**
     * 写入数据
     * @param {*} prompts 
     * @param {*} dest 
     */
    write(prompts, dest) {
        let pack = require(path.join(dest, "package.json"));
        // const wtmfile = path.join(dest, "wtmfront.json");
        pack.name = prompts.projectName;
        pack.author = "";
        delete pack.scripts.swagger;
        delete pack.scripts.test;
        fs.writeJsonSync(path.join(dest, "package.json"), pack, { spaces: 4 })
    }
    /**
     * 拷贝项目
     * @param {*} prompts 
     * @param {*} dest 
     */
    copy(prompts, dest) {
        const projectPath = path.join(this.rootPath, prompts.projectName);
        fs.mkdirSync(projectPath);
        fs.copySync(dest, projectPath);
    }
}
module.exports = Update
