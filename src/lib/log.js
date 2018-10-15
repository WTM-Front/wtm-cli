const logSymbols = require('log-symbols');
const chalk = require('chalk');
const log = console.log;
const txt = chalk.bgGreen(chalk.red(" [WTM] "))
module.exports = {
    success: (msg, ...age) => log(txt, logSymbols.success, chalk.green(msg), ...age),
    info: (msg, ...age) => log(txt, logSymbols.info, chalk.blue(msg), ...age),
    error: (msg, ...age) => log(txt, logSymbols.error, chalk.red(msg), ...age),
    warning: (msg, ...age) => log(txt, logSymbols.warning, chalk.yellow(msg), ...age),
}