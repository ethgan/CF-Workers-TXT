# 📝 CF-Workers-TEXT

> 基于 Cloudflare Workers + KV 的在线文本/Markdown 管理器，支持多种订阅格式输出

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ethgan/Online-Text-Edit)

---

## ✨ 功能特性

### 📌 核心功能
- **在线编辑器** - 支持纯文本、Markdown、JSON 等格式
- **实时预览** - Markdown 实时渲染，支持代码高亮
- **多种视图** - 编辑/预览/分栏 三种模式自由切换
- **快捷保存** - 支持 `Ctrl+S` / `Cmd+S` 快捷键

### 📡 订阅格式支持

| 端点 | 格式 | 适用场景 |
|:-----|:-----|:---------|
| `/sub` | Base64 编码 | v2rayN、Clash、Shadowrocket、Quantumult X |
| `/txt` | 纯文本 | 需要原始文本的客户端 |
| `/tvbox` | JSON | TVBox、影视盒子、猫影视 |
| `/clash` | YAML | Clash、ClashX、Clash for Windows |
| `/md` | HTML 页面 | 浏览器查看 Markdown 文档 |
| `/raw` | 文件下载 | 直接下载 config.txt 文件 |

### 🔐 安全特性
- 管理员通过 UUID 私密路径访问
- 访客通过 Token 验证访问
- 支持自定义 Token 或随机生成

---

## 🚀 快速部署

### 方式一：Cloudflare Dashboard（推荐新手）

#### 1️⃣ 创建 KV 命名空间

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 `Workers & Pages` → `KV`
3. 点击 `Create a namespace`
4. 输入名称（如 `TEXT_KV`），点击 `Add`

#### 2️⃣ 创建 Worker

1. 进入 `Workers & Pages` → `Create application` → `Create Worker`
2. 设置 Worker 名称（如 `text-manager`）
3. 点击 `Deploy` 创建空 Worker
4. 点击 `Edit code`，将 `worker.js` 代码粘贴进去
5. 点击 `Save and deploy`

#### 3️⃣ 绑定 KV 和环境变量

1. 进入 Worker 设置页 → `Settings` → `Variables`
2. **KV Namespace Bindings**：
   - Variable name: `KV`
   - KV namespace: 选择刚创建的命名空间
3. **Environment Variables**：
   - `ADMIN_UUID`: 设置管理员访问路径（建议使用 UUID）
   - `FILENAME`: （可选）自定义页面标题

#### 4️⃣ 访问使用

```
管理页面：https://your-worker.workers.dev/<ADMIN_UUID>
```

---

### 方式二：Wrangler CLI（推荐开发者）

#### 1️⃣ 安装 Wrangler

```bash
npm install -g wrangler
wrangler login
```

#### 2️⃣ 创建项目

```bash
mkdir cf-text && cd cf-text
```

#### 3️⃣ 创建 wrangler.toml

```toml
name = "text-manager"
main = "worker.js"
compatibility_date = "2024-01-01"

[vars]
ADMIN_UUID = "your-secret-uuid-here"
FILENAME = "CF-Workers-TEXT"

[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"
```

#### 4️⃣ 创建 KV 并部署

```bash
# 创建 KV 命名空间
wrangler kv:namespace create "KV"

# 将返回的 id 填入 wrangler.toml

# 部署
wrangler deploy
```

---

## 📖 使用说明

### 管理员操作

1. **访问管理页面**
   ```
   https://your-worker.workers.dev/<ADMIN_UUID>
   ```

2. **编辑内容**
   - 在编辑器中输入/粘贴内容
   - 支持纯文本、Markdown、JSON、订阅链接等

3. **保存内容**
   - 点击 `💾 保存` 按钮
   - 或使用快捷键 `Ctrl+S` / `Cmd+S`

4. **生成访客链接**
   - 点击 `🔗 访客设置`
   - 输入自定义 Token 或留空自动生成
   - 点击 `🔑 生成 / 更新 Token`
   - 复制所需的订阅链接

### 访客访问

根据不同用途选择对应的订阅地址：

#### 📡 代理订阅（v2rayN / Clash / Shadowrocket）
```
https://your-worker.workers.dev/sub?token=<Token>
```
> 自动 Base64 编码，适用于大多数代理客户端

#### 📺 TVBox 订阅
```
https://your-worker.workers.dev/tvbox?token=<Token>
```
> 原样输出 JSON，`Content-Type: application/json`

#### 🎯 Clash 专用
```
https://your-worker.workers.dev/clash?token=<Token>
```
> YAML 格式，带 `Content-Disposition` 下载头

#### 📄 纯文本
```
https://your-worker.workers.dev/txt?token=<Token>
```
> 不做任何编码处理

#### 📘 Markdown 页面
```
https://your-worker.workers.dev/md?token=<Token>
```
> 渲染为网页，支持 GitHub 风格 Markdown

#### ⬇️ 下载文件
```
https://your-worker.workers.dev/raw?token=<Token>
```
> 直接下载为 `config.txt` 文件

---

## 💡 使用场景示例

### 场景一：代理订阅托管

将 v2ray/trojan/ss 节点链接粘贴到编辑器，每行一个：

```
vmess://eyJhZGQiOiIxMjMuNDUuNjcuODkiLCJwb3J0Ijo0NDMsLi4ufQ==
trojan://password@server:443?sni=example.com#节点名称
ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@server:8388#SS节点
```

保存后使用 `/sub?token=xxx` 订阅链接导入客户端。

### 场景二：TVBox 配置托管

粘贴 TVBox JSON 配置：

```json
{
  "sites": [
    {"key": "csp_Alist", "name": "Alist", "type": 3, "api": "csp_Alist"}
  ],
  "lives": [
    {"name": "直播", "url": "https://example.com/live.txt"}
  ]
}
```

使用 `/tvbox?token=xxx` 链接导入 TVBox。

### 场景三：Markdown 文档分享

使用 Markdown 语法编写文档：

```markdown
# 我的教程

## 前言
这是一份详细的使用教程...

## 步骤
1. 第一步
2. 第二步

## 代码示例
\`\`\`python
print("Hello World")
\`\`\`
```

使用 `/md?token=xxx` 链接分享给他人查看。

### 场景四：Clash 配置托管

粘贴完整的 Clash YAML 配置：

```yaml
port: 7890
socks-port: 7891
mode: rule

proxies:
  - name: "节点1"
    type: vmess
    server: server.com
    port: 443
    ...

rules:
  - DOMAIN-SUFFIX,google.com,PROXY
  - GEOIP,CN,DIRECT
  - MATCH,PROXY
```

使用 `/clash?token=xxx` 链接导入 Clash。

---

## 🔧 高级配置

### 自定义域名

1. 在 Cloudflare Dashboard 绑定自定义域名
2. 进入 Worker → Triggers → Custom Domains
3. 添加你的域名（需先将域名 DNS 托管到 Cloudflare）

### 禁用 Base64 编码

在订阅链接后添加 `&base64=0` 参数：
```
/sub?token=xxx&base64=0
```

### 响应头说明

所有订阅端点都包含以下响应头：

| 响应头 | 说明 |
|--------|------|
| `Access-Control-Allow-Origin: *` | 允许跨域访问 |
| `Cache-Control: no-cache` | 禁用缓存，保证获取最新内容 |
| `Profile-Update-Interval: 24` | 建议客户端每24小时更新一次 |
| `Subscription-Userinfo` | 订阅流量信息（模拟） |

---

## ❓ 常见问题

### Q: Token 忘记了怎么办？
A: 重新在管理页面生成新 Token 即可，旧 Token 会自动失效。

### Q: 可以设置多个 Token 吗？
A: 当前版本只支持单 Token。如需多用户，可部署多个 Worker。

### Q: 内容有大小限制吗？
A: Cloudflare KV 单个值最大 25MB，一般使用足够。

### Q: 如何更新管理员密码？
A: 修改 Worker 环境变量中的 `ADMIN_UUID` 即可。

### Q: 支持图片吗？
A: Markdown 中可以引用外部图片链接，但不支持上传图片。

---

## 📄 开源协议

MIT License

---

## 🙏 致谢

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [marked.js](https://marked.js.org/)
- [highlight.js](https://highlightjs.org/)
- [github-markdown-css](https://github.com/sindresorhus/github-markdown-css)

---

## 📺 相关链接

- **YouTube**: [好软推荐](https://www.youtube.com/@%E5%A5%BD%E8%BD%AF%E6%8E%A8%E8%8D%90)
- **GitHub**: [Online-Text-Edit](https://github.com/ethgan/Online-Text-Edit)

---

> 💬 如有问题或建议，欢迎提交 Issue 或 PR！
