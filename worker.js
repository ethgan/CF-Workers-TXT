// ============= 在线文本管理器（自定义访客 Token + 图标） =============
// 管理员： https://<worker域名>/<ADMIN_UUID>
// 访   客： https://<worker域名>/sub?token=<自定义Token>

// ===== 默认配置 =====
let ADMIN_UUID = null;        // 必填
let FileName   = 'CF-Workers-TXT';

const TXT_FILE = 'TEXT.txt';

// ===== 工具 =====
function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

// ===== 主入口 =====
export default {
  async fetch(request, env) {
    ADMIN_UUID = env.ADMIN_UUID || ADMIN_UUID;
    FileName   = env.FILENAME   || FileName;

    const url = new URL(request.url);
    const pathname = url.pathname.slice(1);
    const token = url.searchParams.get('token');

    // 未设置 ADMIN_UUID
    if (!ADMIN_UUID) {
      return new Response(
        `<!doctype html><meta charset="utf-8"><h1>⚠️ 请先设置环境变量 ADMIN_UUID</h1>`,
        { status: 400, headers: { 'Content-Type': 'text/html;charset=utf-8' } }
      );
    }

    // 管理员页面
    if (pathname === ADMIN_UUID) {
      if (request.method === 'POST') {
        const body = await request.text();
        if (body.startsWith('GUESTGEN|')) {
          // 生成/保存访客 Token
          const custom = body.split('|')[1] || uuidv4();
          await env.KV.put('GUEST_TOKEN', custom);
          return new Response(custom);
        }
        // 保存文本
        await env.KV.put(TXT_FILE, body);
        return new Response('saved');
      }
      const content = await env.KV.get(TXT_FILE) || '';
      return new Response(adminPage(content), {
        headers: { 'Content-Type': 'text/html;charset=utf-8' }
      });
    }

    // 访客查看
    if (url.pathname === '/sub' && token) {
      const saved = await env.KV.get('GUEST_TOKEN');
      if (token !== saved) return new Response('Token invalid', { status: 403 });
      const data = await env.KV.get(TXT_FILE) || '';
      return new Response(data, {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};

// ===== 管理页 HTML =====
function adminPage(content) {
  return `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<title>${FileName} 管理器</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;padding:15px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto;font-size:14px;background:#f7f8fa;color:#333}
h1{margin-top:0;font-size:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap}
h1 span{display:flex;align-items:center;gap:12px;font-size:14px;font-weight:400}
a{color:inherit;text-decoration:none;display:inline-flex;align-items:center;gap:2px}
textarea{width:100%;height:60vh;border:1px solid #d0d7de;border-radius:6px;padding:10px;resize:vertical}
button{margin:8px 4px 0 0;padding:6px 14px;border:none;border-radius:6px;background:#238636;color:#fff;cursor:pointer}
#share{margin-top:10px;padding:10px;border:1px dashed #d0d7de;border-radius:6px;background:#fff}
#share input{width:100%;margin-top:4px;padding:4px;border:1px solid #d0d7de;border-radius:4px;font-family:monospace}
</style>
<script src="https://cdn.jsdelivr.net/npm/@keeex/qrcodejs-kx@1.0.2/qrcode.min.js"></script>
</head>
<body>
<h1>
  ${FileName} 管理器
  <span>
    <a href="https://www.youtube.com/@%E5%A5%BD%E8%BD%AF%E6%8E%A8%E8%8D%90" target="_blank" title="好软推荐">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color:#ff0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.016 3.016 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12 9.545 15.568z"/>
      </svg>
      好软推荐
    </a>
    <a href="https://github.com/ethgan/Online-Text-Edit" target="_blank" title="GitHub">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.085 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
      GitHub
    </a>
  </span>
</h1>

<textarea id="editor">${content}</textarea>
<div>
  <button onclick="save()">保存</button>
  <span id="status"></span>
</div>

<div id="share">
  <strong>访客 Token 设置</strong><br>
  <input id="customToken" placeholder="留空随机生成">
  <button onclick="gen()">生成 / 更新</button>
  <div id="link" style="margin-top:8px;display:none">
    访客地址：<input id="url" readonly>
    <div id="qr"></div>
  </div>
</div>

<script>
const path = location.href.split('/').slice(0,-1).join('/');
function save() {
  const btn = event.target;
  btn.disabled = true;
  fetch(location.href, { method:'POST', body: editor.value })
    .then(() => status.textContent = '已保存')
    .catch(() => status.textContent = '保存失败')
    .finally(() => btn.disabled = false);
}
function gen() {
  const custom = customToken.value.trim();
  fetch(location.href, { method:'POST', body: 'GUESTGEN|' + custom })
    .then(r => r.text())
    .then(t => {
      const url = path + '/sub?token=' + t;
      urlInput.value = url;
      link.style.display = 'block';
      qr.innerHTML = '';
      new QRCode(qr, { text:url, width:120, height:120 });
    });
}
const urlInput = document.getElementById('url');
const link = document.getElementById('link');
const qr = document.getElementById('qr');
</script>
</body>
</html>`;
}