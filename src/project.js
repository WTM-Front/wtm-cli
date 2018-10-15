
const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const inquirer = require('inquirer')
const semver = require('semver')
const child_process = require('child_process')
const download = require("./lib/download")
const log = require("./lib/log")
class Project {
    constructor(options) {
        const unSupportedVer = semver.lt(process.version, 'v7.6.0')
        if (unSupportedVer) {
            throw new Error('Node.js 版本过低，推荐升级 Node.js 至 v8.0.0+')
        }
        this.rootPath = process.cwd();
        this.options = Object.assign({
            // 项目名称
            projectName: null,
            // 模板
            template: null,
            // swagger doc 地址
            swagger: null,
            // 执行npm install
            install: null,
        }, options)
        // console.log(this);
    }
    /**
     * 初始化参数
     */
    init() {
        const prompts = []
        const options = this.options
        // 项目名称
        if (typeof options.projectName !== 'string') {
            prompts.push({
                type: 'input',
                name: 'projectName',
                message: '请输入项目名称！',
                validate(input) {
                    if (!input) {
                        return '项目名不能为空！'
                    }
                    if (fs.existsSync(input)) {
                        return '当前目录已经存在同名项目，请换一个项目名！'
                    }
                    return true
                }
            })
        } else if (fs.existsSync(options.projectName)) {
            prompts.push({
                type: 'input',
                name: 'projectName',
                message: '当前目录已经存在同名项目，请换一个项目名！',
                validate(input) {
                    if (!input) {
                        return '项目名不能为空！'
                    }
                    if (fs.existsSync(input)) {
                        return '项目名依然重复！'
                    }
                    return true
                }
            })
        }
        // 模板
        const templateChoices = [{
            name: 'React',
            value: 'react'
        }, {
            name: 'Vue',
            value: 'vue'
        }]
        if (typeof options.template !== 'string') {
            prompts.push({
                type: 'list',
                name: 'template',
                message: '请选择模板',
                choices: templateChoices
            })
        } else {
            let isTemplateExist = false
            templateChoices.forEach(item => {
                if (item.value === options.template) {
                    isTemplateExist = true
                }
            })
            if (!isTemplateExist) {
                log.error('你选择的模板不存在')
                log.info('目前提供了以下模板以供使用:')
                console.log()
                templateChoices.forEach(item => {
                    console.log(chalk.green(`- ${item.name}`))
                })
                process.exit(1)
            }
        }
        if (typeof options.install !== 'boolean') {
            prompts.push({
                type: 'confirm',
                name: 'install',
                message: '是否执行npm install ？'
            })
        }
        // if (typeof options.swagger !== 'string') {
        //     prompts.push({
        //         type: 'input',
        //         name: 'swagger',
        //         message: '请输入swagger-doc地址！',
        //         choices: templateChoices
        //     })
        // }
        return inquirer.prompt(prompts)
    }
    /**
     * 创建项目
     */
    async create() {
        const prompts = await this.init();
        const dest = await this.download(prompts);
        this.write(prompts, dest);
        this.copy(prompts, dest);
        await this.downloadSwagger(prompts)
        this.exec(prompts)
        log.success(`项目：【 ${prompts.projectName} 】 创建完成`)
    }
    /**
     * 命令
     * @param {*} prompts 
     */
    exec(prompts) {
        const projectPath = path.join(this.rootPath, prompts.projectName);
        child_process.exec(`code -g -n ${projectPath}`, { cwd: projectPath, maxBuffer: 999999999 }, (error, stdout, stderr) => {
            if (error) {
                log.error('vscode 开启项目出错，请自行打开项目');
            }
        });
        if (prompts.install) {
            // this.runCommand('npma', ['install -d --registry=https://registry.npm.taobao.org/'])
            const spawn = child_process.spawnSync(
                "npm",
                ['install --registry=https://registry.npm.taobao.org/'],
                {
                    cwd: this.rootPath,
                    stdio: 'inherit',
                    shell: true,
                }
            )
            if (spawn.status == 1) {
                log.error(`安装项目依赖失败，请自行重新安装！`)
            }
        }
    }
    /**
     * 下载模板
     */
    async download(prompts) {
        let url = "WTM-Front/wtm-template-react";
        const dest = path.join(path.dirname(__dirname), 'temporary', prompts.projectName);
        if (prompts.template == "vue") {
            url = "WTM-Front/wtm-template-vue";
        }
        fs.removeSync(dest);
        return await download(url, dest)
    }
    /**
    * 下载解析模块
    */
    async downloadSwagger(prompts) {
        let url = "WTM-Front/wtm-swagger";
        const projectPath = path.join(this.rootPath, prompts.projectName, "wtmfront", "swagger");
        return await download(url, projectPath, {
            start: "下载 Swagger 解析组件",
            error: "Swagger 解析组件 下载失败 请手动执行 wtm update swagger",
            success: "Swagger 解析组件 下载完成",
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
    /**
     * 执行命令
     * @param {*} cmd 
     * @param {*} args 
     * @param {*} options 
     */
    runCommand(cmd, args, options) {
        return new Promise((resolve, reject) => {
            const spwan = child_process.spawn(
                cmd,
                args,
                Object.assign(
                    {
                        cwd: process.cwd(),
                        stdio: 'inherit',
                        shell: true,
                    },
                    options
                )
            )
            spwan.on('exit', () => {
                resolve()
            })
        })
    }
}
module.exports = Project
