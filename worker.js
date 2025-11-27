// ============= 在线文本/Markdown 管理器 =============
// 管理员： https://<worker域名>/<ADMIN_UUID>
// 访客TXT： https://<worker域名>/txt?token=<Token>
// 访客MD：  https://<worker域名>/md?token=<Token>
// 订阅：    https://<worker域名>/sub?token=<Token>
// TVBox：   https://<worker域名>/tvbox?token=<Token>
// Clash：   https://<worker域名>/clash?token=<Token>
// 原始内容：https://<worker域名>/raw?token=<Token>

// ===== 默认配置 =====
let ADMIN_UUID = null;
let FileName = 'CF-Workers-TEXT';

const CONTENT_FILE = 'CONTENT.txt';

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
    FileName = env.FILENAME || FileName;

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
          const custom = body.split('|')[1] || uuidv4();
          await env.KV.put('GUEST_TOKEN', custom);
          return new Response(custom);
        }
        await env.KV.put(CONTENT_FILE, body);
        return new Response('saved');
      }
      const content = await env.KV.get(CONTENT_FILE) || '';
      return new Response(adminPage(content), {
        headers: { 'Content-Type': 'text/html;charset=utf-8' }
      });
    }

    // 验证 Token
    async function checkToken() {
      if (!token) return false;
      const saved = await env.KV.get('GUEST_TOKEN');
      return token === saved;
    }

    // 访客 - 纯文本 TXT（订阅链接专用）
    if (url.pathname === '/txt' && token) {
      if (!await checkToken()) return new Response('Token invalid', { status: 403 });
      const data = await env.KV.get(CONTENT_FILE) || '';
      return new Response(data, {
        status: 200,
        headers: { 
          'Content-Type': 'text/plain;charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Subscription-Userinfo': `upload=0; download=0; total=10737418240; expire=${Math.floor(Date.now()/1000) + 31536000}`
        }
      });
    }

    // 访客 - Base64 编码（v2rayN、Shadowrocket 等）
    if (url.pathname === '/sub' && token) {
      if (!await checkToken()) return new Response('Token invalid', { status: 403 });
      const data = await env.KV.get(CONTENT_FILE) || '';
      const needBase64 = url.searchParams.get('base64') !== '0';
      const output = needBase64 ? btoa(unescape(encodeURIComponent(data))) : data;
      return new Response(output, {
        status: 200,
        headers: { 
          'Content-Type': 'text/plain;charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Profile-Update-Interval': '24',
          'Subscription-Userinfo': `upload=0; download=0; total=10737418240; expire=${Math.floor(Date.now()/1000) + 31536000}`
        }
      });
    }

    // 访客 - TVBox 订阅（原样输出 JSON）
    if (url.pathname === '/tvbox' && token) {
      if (!await checkToken()) return new Response('Token invalid', { status: 403 });
      const data = await env.KV.get(CONTENT_FILE) || '';
      return new Response(data, {
        status: 200,
        headers: { 
          'Content-Type': 'application/json;charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    // 访客 - Clash 订阅（YAML 格式）
    if (url.pathname === '/clash' && token) {
      if (!await checkToken()) return new Response('Token invalid', { status: 403 });
      const data = await env.KV.get(CONTENT_FILE) || '';
      return new Response(data, {
        status: 200,
        headers: { 
          'Content-Type': 'text/yaml;charset=utf-8',
          'Content-Disposition': 'attachment; filename="clash.yaml"',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Profile-Update-Interval': '24',
          'Subscription-Userinfo': `upload=0; download=0; total=10737418240; expire=${Math.floor(Date.now()/1000) + 31536000}`
        }
      });
    }

    // 访客 - 原始内容下载
    if (url.pathname === '/raw' && token) {
      if (!await checkToken()) return new Response('Token invalid', { status: 403 });
      const data = await env.KV.get(CONTENT_FILE) || '';
      return new Response(data, {
        headers: { 
          'Content-Type': 'text/plain;charset=utf-8',
          'Content-Disposition': 'attachment; filename="config.txt"',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 访客 - Markdown 渲染
    if (url.pathname === '/md' && token) {
      if (!await checkToken()) return new Response('Token invalid', { status: 403 });
      const data = await env.KV.get(CONTENT_FILE) || '';
      return new Response(viewerPageMD(data), {
        headers: { 'Content-Type': 'text/html;charset=utf-8' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};

// ===== 管理页 HTML =====
function adminPage(content) {
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<title>${FileName} 管理器</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.1/github-markdown-light.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github.min.css">
<style>
* { box-sizing: border-box; }
body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto; font-size:14px; background:#f6f8fa; color:#24292f; }
.header { padding:12px 20px; background:#24292f; color:#fff; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; }
.header h1 { margin:0; font-size:18px; font-weight:600; }
.header-links { display:flex; align-items:center; gap:14px; }
.header a { color:#fff; text-decoration:none; display:inline-flex; align-items:center; gap:4px; opacity:0.85; }
.header a:hover { opacity:1; }
.toolbar { padding:10px 20px; background:#fff; border-bottom:1px solid #d0d7de; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.toolbar button { padding:5px 12px; border:1px solid #d0d7de; border-radius:6px; background:#f6f8fa; cursor:pointer; font-size:13px; transition: all 0.2s; }
.toolbar button:hover { background:#e8ebef; }
.toolbar button.primary { background:#238636; color:#fff; border-color:#238636; }
.toolbar button.primary:hover { background:#2ea043; }
.toolbar button.active-share { background:#0969da; color:#fff; border-color:#0969da; }
.tabs { display:flex; gap:0; }
.tabs button { border-radius:6px 6px 0 0; border-bottom:none; margin-bottom:-1px; padding:6px 16px; }
.tabs button.active { background:#fff; border-bottom:1px solid #fff; font-weight:600; }
#status { margin-left:auto; color:#57606a; font-size:12px; }

/* 访客设置面板 - 顶部展开 */
#sharePanel { 
  display:none; 
  background:#f8fafc; 
  border-bottom:1px solid #d0d7de; 
  padding:16px 20px; 
  animation: slideDown 0.2s ease;
}
#sharePanel.show { display:block; }
@keyframes slideDown {
  from { opacity:0; transform:translateY(-10px); }
  to { opacity:1; transform:translateY(0); }
}
.share-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.share-header h3 { margin:0; font-size:14px; color:#24292f; }
.share-header .close-btn { background:none; border:none; font-size:18px; cursor:pointer; color:#57606a; padding:0; }
.share-header .close-btn:hover { color:#24292f; }
.token-row { display:flex; gap:10px; align-items:center; margin-bottom:16px; flex-wrap:wrap; }
.token-row input { flex:1; min-width:200px; padding:6px 10px; border:1px solid #d0d7de; border-radius:6px; font-family:monospace; font-size:13px; }
.token-row button { padding:6px 14px; }

.links-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:12px; }
.link-card { background:#fff; border:1px solid #d0d7de; border-radius:8px; padding:12px; }
.link-card .title { display:flex; align-items:center; gap:6px; font-weight:600; font-size:13px; margin-bottom:4px; }
.link-card .title .icon { font-size:16px; }
.link-card .desc { font-size:11px; color:#8b949e; margin-bottom:8px; }
.link-card .link-row { display:flex; gap:6px; }
.link-card input { flex:1; padding:5px 8px; border:1px solid #d0d7de; border-radius:4px; font-family:monospace; font-size:12px; background:#f6f8fa; }
.link-card button { padding:5px 10px; font-size:12px; }

#qrSection { margin-top:16px; display:flex; gap:16px; flex-wrap:wrap; justify-content:center; padding-top:16px; border-top:1px solid #d0d7de; }
.qr-box { text-align:center; background:#fff; padding:12px; border-radius:8px; border:1px solid #d0d7de; }
.qr-box p { margin:0 0 8px; font-size:12px; color:#57606a; font-weight:500; }

/* 标签样式 */
.tag { display:inline-block; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:500; margin-left:6px; }
.tag-v2ray { background:#e3f2fd; color:#1565c0; }
.tag-clash { background:#fff3e0; color:#e65100; }
.tag-tvbox { background:#f3e5f5; color:#7b1fa2; }
.tag-all { background:#e8f5e9; color:#2e7d32; }

.container { display:flex; height:calc(100vh - 110px); }
.container.with-panel { height:calc(100vh - 380px); }
.editor-pane, .preview-pane { flex:1; overflow:auto; }
.editor-pane { border-right:1px solid #d0d7de; display:flex; flex-direction:column; }
.editor-pane.hidden, .preview-pane.hidden { display:none; }
#editor { flex:1; width:100%; border:none; padding:16px 20px; resize:none; font-family:"SF Mono",Consolas,"Liberation Mono",Menlo,monospace; font-size:14px; line-height:1.6; background:#fff; outline:none; }
.preview-pane { background:#fff; }
.markdown-body { padding:20px 32px; max-width:980px; margin:0 auto; }
.markdown-body img { max-width:100%; }

@media (max-width: 768px) {
  .container { flex-direction:column; height:auto; min-height:50vh; }
  .container.with-panel { height:auto; }
  .editor-pane, .preview-pane { height:50vh; border-right:none; border-bottom:1px solid #d0d7de; }
  .tabs button { padding:6px 10px; font-size:12px; }
  #qrSection { flex-direction:column; align-items:center; }
  .links-grid { grid-template-columns:1fr; }
  .token-row { flex-direction:column; align-items:stretch; }
  .token-row input { min-width:100%; }
}
</style>
</head>
<body>

<div class="header">
  <h1>📝 ${FileName}</h1>
  <div class="header-links">
    <a href="https://www.youtube.com/@%E5%A5%BD%E8%BD%AF%E6%8E%A8%E8%8D%90" target="_blank">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.016 3.016 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12 9.545 15.568z"/></svg>
      好软推荐
    </a>
    <a href="https://github.com/ethgan/Online-Text-Edit" target="_blank">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.085 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
      GitHub
    </a>
  </div>
</div>

<div class="toolbar">
  <div class="tabs">
    <button id="tabEdit" class="active" onclick="switchTab('edit')">✏️ 编辑</button>
    <button id="tabPreview" onclick="switchTab('preview')">👁️ 预览MD</button>
    <button id="tabBoth" onclick="switchTab('both')">⚡ 分栏</button>
  </div>
  <button class="primary" onclick="save()">💾 保存</button>
  <button id="shareBtn" onclick="toggleShare()">🔗 访客设置</button>
  <span id="status"></span>
</div>

<!-- 访客设置面板 -->
<div id="sharePanel">
  <div class="share-header">
    <h3>🔐 访客 Token 与订阅链接</h3>
    <button class="close-btn" onclick="toggleShare()">✕</button>
  </div>
  
  <div class="token-row">
    <input type="text" id="customToken" placeholder="自定义 Token（留空随机生成 UUID）">
    <button class="primary" onclick="gen()">🔑 生成 / 更新 Token</button>
  </div>
  
  <div id="linkSection" style="display:none">
    <div class="links-grid">
      <div class="link-card">
        <div class="title">
          <span class="icon">📡</span> 订阅地址（Base64）
          <span class="tag tag-v2ray">v2rayN</span>
          <span class="tag tag-clash">Clash</span>
        </div>
        <div class="desc">Base64 编码，适用于 v2rayN、Clash、Shadowrocket 等主流客户端</div>
        <div class="link-row">
          <input type="text" id="subUrl" readonly onclick="this.select()">
          <button onclick="copyUrl('subUrl')">复制</button>
        </div>
      </div>
      
      <div class="link-card">
        <div class="title">
          <span class="icon">📺</span> TVBox 订阅地址
          <span class="tag tag-tvbox">TVBox</span>
        </div>
        <div class="desc">原样输出 JSON，适用于 TVBox、影视 APP 等</div>
        <div class="link-row">
          <input type="text" id="tvboxUrl" readonly onclick="this.select()">
          <button onclick="copyUrl('tvboxUrl')">复制</button>
        </div>
      </div>
      
      <div class="link-card">
        <div class="title">
          <span class="icon">🎯</span> Clash 专用订阅
          <span class="tag tag-clash">Clash</span>
        </div>
        <div class="desc">YAML 格式，Clash/ClashX/CFW 专用</div>
        <div class="link-row">
          <input type="text" id="clashUrl" readonly onclick="this.select()">
          <button onclick="copyUrl('clashUrl')">复制</button>
        </div>
      </div>
      
      <div class="link-card">
        <div class="title">
          <span class="icon">📄</span> 纯文本地址
          <span class="tag tag-all">通用</span>
        </div>
        <div class="desc">不编码原样输出，适用于部分特殊客户端</div>
        <div class="link-row">
          <input type="text" id="txtUrl" readonly onclick="this.select()">
          <button onclick="copyUrl('txtUrl')">复制</button>
        </div>
      </div>
      
      <div class="link-card">
        <div class="title">
          <span class="icon">📘</span> Markdown 页面
          <span class="tag tag-all">文档</span>
        </div>
        <div class="desc">网页形式展示，适合文档/笔记/教程分享</div>
        <div class="link-row">
          <input type="text" id="mdUrl" readonly onclick="this.select()">
          <button onclick="copyUrl('mdUrl')">复制</button>
        </div>
      </div>
      
      <div class="link-card">
        <div class="title">
          <span class="icon">⬇️</span> 下载原始文件
        </div>
        <div class="desc">直接下载 config.txt 文件</div>
        <div class="link-row">
          <input type="text" id="rawUrl" readonly onclick="this.select()">
          <button onclick="copyUrl('rawUrl')">复制</button>
        </div>
      </div>
    </div>
    
    <div id="qrSection">
      <div class="qr-box">
        <p>📡 订阅二维码</p>
        <div id="qrSub"></div>
      </div>
      <div class="qr-box">
        <p>📺 TVBox 二维码</p>
        <div id="qrTvbox"></div>
      </div>
      <div class="qr-box">
        <p>📘 MD 页面二维码</p>
        <div id="qrMd"></div>
      </div>
    </div>
  </div>
</div>

<div class="container" id="container">
  <div class="editor-pane" id="editorPane">
    <textarea id="editor" placeholder="在这里输入内容（支持纯文本、Markdown、JSON 配置等）...">${escaped}</textarea>
  </div>
  <div class="preview-pane hidden" id="previewPane">
    <div class="markdown-body" id="preview"></div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/marked@12.0.1/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/highlight.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@keeex/qrcodejs-kx@1.0.2/qrcode.min.js"></script>
<script>
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const editorPane = document.getElementById('editorPane');
const previewPane = document.getElementById('previewPane');
const container = document.getElementById('container');
const sharePanel = document.getElementById('sharePanel');
const shareBtn = document.getElementById('shareBtn');
const status = document.getElementById('status');
let currentTab = 'edit';

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
  document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
  
  if (tab === 'edit') {
    editorPane.classList.remove('hidden');
    previewPane.classList.add('hidden');
  } else if (tab === 'preview') {
    editorPane.classList.add('hidden');
    previewPane.classList.remove('hidden');
    renderPreview();
  } else {
    editorPane.classList.remove('hidden');
    previewPane.classList.remove('hidden');
    renderPreview();
  }
}

function renderPreview() {
  preview.innerHTML = marked.parse(editor.value);
  preview.querySelectorAll('pre code').forEach(block => {
    hljs.highlightElement(block);
  });
}

editor.addEventListener('input', () => {
  if (currentTab === 'both') {
    renderPreview();
  }
});

function save() {
  status.textContent = '保存中...';
  fetch(location.href, { method:'POST', body: editor.value })
    .then(r => {
      if (r.ok) {
        status.textContent = '✅ 已保存 ' + new Date().toLocaleTimeString();
      } else {
        throw new Error();
      }
    })
    .catch(() => status.textContent = '❌ 保存失败');
}

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    save();
  }
});

function toggleShare() {
  const isShowing = sharePanel.classList.toggle('show');
  shareBtn.classList.toggle('active-share', isShowing);
  container.classList.toggle('with-panel', isShowing);
}

const basePath = location.href.split('/').slice(0,-1).join('/');

function gen() {
  const custom = document.getElementById('customToken').value.trim();
  fetch(location.href, { method:'POST', body: 'GUESTGEN|' + custom })
    .then(r => r.text())
    .then(t => {
      const subUrl = basePath + '/sub?token=' + t;
      const txtUrl = basePath + '/txt?token=' + t;
      const mdUrl = basePath + '/md?token=' + t;
      const rawUrl = basePath + '/raw?token=' + t;
      const tvboxUrl = basePath + '/tvbox?token=' + t;
      const clashUrl = basePath + '/clash?token=' + t;
      
      document.getElementById('subUrl').value = subUrl;
      document.getElementById('txtUrl').value = txtUrl;
      document.getElementById('mdUrl').value = mdUrl;
      document.getElementById('rawUrl').value = rawUrl;
      document.getElementById('tvboxUrl').value = tvboxUrl;
      document.getElementById('clashUrl').value = clashUrl;
      document.getElementById('linkSection').style.display = 'block';
      
      status.textContent = '✅ Token 已生成: ' + t.substring(0, 8) + '...';
      
      // 生成二维码
      const qrSub = document.getElementById('qrSub');
      const qrTvbox = document.getElementById('qrTvbox');
      const qrMd = document.getElementById('qrMd');
      qrSub.innerHTML = '';
      qrTvbox.innerHTML = '';
      qrMd.innerHTML = '';
      
      new QRCode(qrSub, { text: subUrl, width:120, height:120 });
      new QRCode(qrTvbox, { text: tvboxUrl, width:120, height:120 });
      new QRCode(qrMd, { text: mdUrl, width:120, height:120 });
    });
}

function copyUrl(id) {
  const input = document.getElementById(id);
  input.select();
  input.setSelectionRange(0, 99999);
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(input.value);
  } else {
    document.execCommand('copy');
  }
  
  status.textContent = '✅ 已复制到剪贴板';
  setTimeout(() => status.textContent = '', 2000);
}

switchTab('both');
</script>
</body>
</html>`;
}

// ===== Markdown 渲染页 =====
function viewerPageMD(markdown) {
  const escaped = markdown
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  return `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<title>${FileName}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.1/github-markdown-light.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github.min.css">
<style>
body { margin:0; padding:0; background:#fff; }
.container { max-width:980px; margin:0 auto; padding:32px; }
.markdown-body { box-sizing:border-box; min-width:200px; }
.markdown-body img { max-width:100%; }
@media (max-width:767px) { .container { padding:16px; } }
@media print { .container { padding:0; } }
</style>
</head>
<body>
<div class="container">
  <article class="markdown-body" id="content"></article>
</div>
<script src="https://cdn.jsdelivr.net/npm/marked@12.0.1/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/highlight.min.js"></script>
<script>
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});
const markdown = \`${escaped}\`;
document.getElementById('content').innerHTML = marked.parse(markdown);
document.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
</script>
</body>
</html>`;
}
