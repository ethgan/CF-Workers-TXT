# Cloudflare 在线文本管理器
该项目是一个极简的在线文本管理器，基于 Cloudflare Workers + KV 存储，提供「实时编辑 / 保存 / 分享」功能。
一个无需数据库、即用即走的纯文本在线编辑与分享工具。可存放任意纯文本内容

[<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/40px-YouTube_full-color_icon_%282017%29.svg.png" width="20"> 观看教程视频][https://www.youtube.com/watch?v=j3jFkGo4czQ&t=]https://www.youtube.com/watch?v=j3jFkGo4czQ&t=

## 🚀 功能概览
在线编辑与实时保存
可设置分享口令（Token）
通过链接公开分享
无需数据库，所有数据保存在 Cloudflare KV

## 🚀 一键workers部署 （建议有域名的部署）
1. 在 Cloudflare 里新建一个 Workers 项目  
2. 粘贴项目中 worker.js 代码，保存并部署  
3. 新建一个 KV 值，变量添加ADMIN\_UUID
4. 在 Workers 项目设置里，绑定新建的 KV 数值  
5. 访问 `https://<worker域名>/ADMIN\_UUID`，可在后台设置访问密码，防止被盗用

## 🚀 一键pages部署 （适合没有自定义域名的部署）
1. 在 Cloudflare 里新建一个 Pages 项目  
2. 上传 pages.zip 压缩包，保存并部署  
3. 新建一个 KV 值，保存  
4. 在 Pages 项目设置里，绑定新建的 KV 数值  变量添加ADMIN\_UUID
5. 重新上传 pages.zip 压缩包，保存并部署（很重要！这一步是为了让 KV 数值生效）  
6. 访问 https://<pages域名>/ADMIN\_UUID，可以在后台设置访问密码，防止被盗用

创作不易，有帮助的点个Star!⭐⭐⭐
感谢~

| 参数名             | 必填 | 说明与示例                                                                |
| --------------- | -- | -------------------------------------------------------------------- |
| **ADMIN\_UUID** | ✅  | 管理员登录密钥，任意字符串 / UUID 均可。<br>例：`8c3b9f3a-9f4b-4c2e-b8a1-3a4f6e8c9f8a` |
| **KV**          | ✅  | KV 命名空间绑定，变量名必须填 **KV**（用于存储文本文件与访客 Token）。                          |
| **FILENAME**    | ❌  | 管理页面的标题，默认为 `CF-Workers-TXT`，可按需修改。                                  |
