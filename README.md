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
