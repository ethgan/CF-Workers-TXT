const defaultText = `#EXTM3U
#EXTINF:-1,示例
https://example.com/
`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const kv = env.KV;

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
    <label>Token（用于分享链接）:</label><br>
    <input type="text" name="token" value="${currentToken}" required><br><br>
    <button type="submit">保存 Token</button>
  </form>
  <hr>
  <a href="/">← 返回编辑页</a>
</body>
</html>`;
      if (request.method === "POST") {
        const form = new URLSearchParams(await request.text());
        const newToken = form.get("token");
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

  <script>
    async function saveText() {
      await fetch("/", { method: "POST", body: document.getElementById("editor").value });
      alert("已保存");
    }
    async function copyShare() {
      const token = "${token}";
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