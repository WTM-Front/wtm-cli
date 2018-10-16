## 安装cli

安装 cli 工具，提供基础项目下载，模板服务 

```bash
$ npm install -g wtm-cli
```
!>[Node.js](https://nodejs.org/en/) (>=8.x, 8.x preferred), npm version 6+ and [Git](https://git-scm.com/).

## 初始化项目
?> 参数顺序为   <项目名称>   
```bash
$ wtm init <project-name> 
```
## 启动项目
?> webpack 配置相同 
```bash
<!-- 根目录 -->
$ npm start 
<!--  webpack-dev-server --open  -->
```
## 启动模板服务

``` bash
$ wtm server 或者 npm run wtm

<!-- 出现如下信息说明模板服务已开启 -->
√ 注入 registerHelper FormItem.js
√ 注入 registerHelper JSON.js
√ 模板服务已启动  ： http://localhost:8765

```