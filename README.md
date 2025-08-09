# Cloudflare Pages 在线文本管理器
该项目是一个极简的在线文本管理器，基于 Cloudflare Workers + KV 存储，提供「实时编辑 / 保存 / 分享」功能。
一个无需数据库、即用即走的纯文本在线编辑与分享工具。可存放任意纯文本内容

## 🚀 功能概览
在线编辑与实时保存
可设置分享口令（Token）
通过链接 https://<worker>/share?token=<token> 公开分享
无需数据库，所有数据保存在 Cloudflare KV

## 🚀 一键workers部署 （建议有域名的部署）
1.在Cloudflare里新建一个workers项目
2.粘贴项目中worker.js代码，保存并部署
3.新建一个KV值，保存
4.在workers项目设置里，绑定新建的KV数值
5.访问 https://<worker域名>  可以在后台设置访问密码，防止被盗用

## 🚀 一键wpages部署 （适合没有自定义域名的部署）
1.在Cloudflare里新建一个pages项目
2.上传pages.zip压缩包，保存并部署
3.新建一个KV值，保存
4.在pages项目设置里，绑定新建的KV数值
5.重新上传pages.zip压缩包，保存并部署 （很重要！这一步是为了让KV数值生效）
5.访问 https://<pages域名>  可以在后台设置访问密码，防止被盗用


