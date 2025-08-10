const defaultText = `#EXTM3U
#EXTINF:-1,示例
https://example.com/
`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const kv = env.KV;

    // Shared footer HTML with YouTube and GitHub links
    const footer = `
      <hr>
      <div style="margin-top: 20px;">
        <p>
          <a href="https://www.youtube.com/@好软推荐" target="_blank" style="text-decoration: none; margin-right: 20px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 5px;">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
            </svg>
            好软推荐
          </a>
          <a href="https://github.com/ethgan/Online-Text-Edit" target="_blank" style="text-decoration: none;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 5px;">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
            Github项目地址
          </a>
        </p>
      </div>
    `;

    // 后台设置 token 的页面
    if (path === "/admin") {
      const currentToken = await kv.get("token") || "share";
      const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>文本管理后台</title>
</head>
<body>
  <h1>🛠️ 后台设置</h1>
  <form method="post" action="/admin">
    <label>Token（用于分享链接，支持特殊字符）:</label><br>
    <input type="text" name="token" value="${currentToken.replace(/"/g, '&quot;')}" required><br><br>
    <button type="submit">保存 Token</button>
  </form>
  <hr>
  <a href="/">← 返回编辑页</a>
  ${footer}
</body>
</html>`;
      if (request.method === "POST") {
        const form = new URLSearchParams(await request.text());
        const newToken = form.get("token")?.trim();
        if (!newToken || newToken.length > 100) {
          return new Response("Token 不能为空或超过100个字符", { status: 400 });
        }
        await kv.put("token", newToken);
        return new Response("Token 已更新", { status: 200 });
      }
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    // 分享链接
    const token = await kv.get("token") || "share";
    if (path === "/share" && url.searchParams.get("token") === token) {
      const text = await kv.get("text") || defaultText;
      return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    // 主页面：编辑文本
    if (path === "/") {
      const saved = await kv.get("text") || defaultText;
      const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>在线文本管理器</title>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #f9f9f9; }
    textarea { width: 100%; height: 60vh; font-size: 16px; font-family: monospace; }
    .actions button { margin-right: 10px; padding: 8px 16px; }
  </style>
</head>
<body>
  <h1>📝 在线文本管理器</h1>
  <textarea id="editor">${saved}</textarea>
  <div class="actions">
    <button onclick="saveText()">保存</button>
    <button onclick="copyShare()">复制分享链接</button>
    <button onclick="location.href='/admin'">后台设置</button>
  </div>
  ${footer}
  <script>
    async function saveText() {
      await fetch("/", { method: "POST", body: document.getElementById("editor").value });
      alert("已保存");
    }
    async function copyShare() {
      const token = "${encodeURIComponent(token)}";
      const link = location.origin + "/share?token=" + token;
      navigator.clipboard.writeText(link);
      alert("分享链接已复制");
    }
  </script>
</body>
</html>`;
      if (request.method === "POST") {
        const body = await request.text();
        await kv.put("text", body);
        return new Response("Saved", { status: 200 });
      }
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return new Response("404 Not Found", { status: 404 });
  }
};