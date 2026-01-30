const MarkdownIt = require('markdown-it');
const juice = require('juice');
const hljs = require('highlight.js');

// ============================================================================
// 1. 定义皮肤样式库 (CSS)
// ============================================================================
const THEMES = {
  // 默认：微信技术风 (黑色/代码块深色/红色强调)
  'wechat-tech': `
    body { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; line-height: 1.75; color: #333; font-size: 16px; }
    h1 { font-size: 24px; font-weight: bold; margin: 30px 0 20px; color: #000; border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { font-size: 20px; font-weight: bold; margin: 30px 0 20px; color: #000; border-left: 4px solid #333; padding-left: 12px; }
    h3 { font-size: 18px; font-weight: bold; margin: 25px 0 15px; color: #333; }
    p { margin-bottom: 16px; text-align: justify; letter-spacing: 0.5px; }
    ul, ol { padding-left: 20px; margin-bottom: 20px; color: #444; }
    li { margin-bottom: 8px; }
    strong { color: #d9534f; font-weight: bold; } /* 重点标红 */
    a { color: #007aff; text-decoration: none; border-bottom: 1px dashed #007aff; }
    blockquote { border-left: 4px solid #ddd; background: #f9f9f9; padding: 15px; color: #666; font-style: italic; margin: 20px 0; }
    /* 代码块高亮样式 (仿 Mac 窗口) */
    pre.hljs { background: #282c34; color: #abb2bf; padding: 15px; border-radius: 8px; overflow-x: auto; font-family: 'Menlo', 'Monaco', monospace; line-height: 1.5; font-size: 14px; margin: 20px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    code { font-family: 'Menlo', 'Monaco', monospace; background: rgba(0,0,0,0.05); padding: 2px 5px; border-radius: 3px; color: #d9534f; font-size: 0.9em; }
    pre code { background: none; padding: 0; color: inherit; }
  `,

  // 选项：掘金蓝 (清爽/蓝色调)
  'juejin-blue': `
    body { font-family: -apple-system, system-ui, sans-serif; line-height: 1.8; color: #2c3e50; font-size: 16px; }
    h1, h2, h3 { color: #1e80ff; margin-top: 24px; margin-bottom: 16px; font-weight: 600; }
    h2 { border-bottom: 1px solid #eaecef; padding-bottom: .3em; font-size: 1.5em; }
    strong { color: #1e80ff; }
    blockquote { border-left: 4px solid #1e80ff; background-color: rgba(30,128,255,0.05); padding: 10px 15px; color: #555; }
    pre.hljs { background: #f5f7f9; color: #333; padding: 15px; border-radius: 4px; border: 1px solid #e1e4e8; font-family: monospace; }
  `
};

// ============================================================================
// 2. 初始化 Markdown 解析器
// ============================================================================
const md = new MarkdownIt({
  html: true,       // 允许 HTML 标签
  breaks: true,     // 换行符转 <br>
  linkify: true,    // 自动识别链接
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>';
      } catch (__) {}
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
});

// ============================================================================
// 3. 核心处理逻辑 (Vercel Serverless Function)
// ============================================================================
module.exports = (req, res) => {
  // 3.1 跨域配置 (允许 n8n 随时调用)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Please use POST.' });
  }

  try {
    // 3.2 获取参数 (容错处理)
    const body = req.body || {};
    const content = body.content || "";
    const themeKey = body.theme || 'wechat-tech';

    // 如果内容为空，返回提示
    if (!content.trim()) {
      return res.status(400).json({ error: 'Content is empty' });
    }

    // 3.3 渲染 Markdown -> HTML (素颜)
    const rawHtml = md.render(content);

    // 3.4 获取 CSS 并注入 (上妆)
    const css = THEMES[themeKey] || THEMES['wechat-tech'];
    const finalHtml = juice.inlineContent(rawHtml, css);

    // 3.5 返回纯文本 HTML (防止 JSON 转义问题)
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(finalHtml);

  } catch (error) {
    console.error("Render Error:", error);
    res.status(500).json({ 
      error: 'Render failed', 
      details: error.message 
    });
  }
};

