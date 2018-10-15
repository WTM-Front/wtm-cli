const download = require('download-git-repo')
const path = require('path');
const ora = require('ora');
const fsExtra = require('fs-extra');
const log = require('./log');
/**
 * 下载模板
 */
module.exports = (repo, dest, options = {}) => {
    const spinner = ora(options.start || `下载模板...`).start();
    return new Promise((resolve, reject) => {
        // 下载 git 模板
        spinner.start();
        download(repo, dest, {}, (err) => {
            if (err) {
                log.error(options.error || "模板 下载失败");
                reject(err)
            } else {
                spinner.stop();
                log.success(options.success || "模板 下载完成");
                resolve(dest)
            }
        })
    })
}