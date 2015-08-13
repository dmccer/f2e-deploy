f2e-deploy
==========

自定义前端静态文件部署工具

## Usage

1. git clone git@git.guluabc.com:node/f2e-deploy.git
2. npm install
3. pm2 start app.js
4. 配置 web hook url: http://localhost:9999/f2e/alpha
5. 静态资源 tar.gz 包下载: http://localhost:9999/alpha/:name?owner=f2e&secret=xxxxxx
6. 查看项目发布 log : http://localhost:9999/alpha/:name/log

## Repo Site Features

1. 搜索和查看项目
2. 项目当前发布状态，及当前版本
3. 项目版本切换
4. 选择分支和环境发布
5. 展示项目发布进度
6. 项目发布权限控制 author & pusher & owner
7. 私有项目发布


## ChangeLog:

### 2015-08-05
1. push handler test

## On Progress

1. 绑定分支和环境
