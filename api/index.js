const MarkdownIt = require('markdown-it');
const juice = require('juice');
const hljs = require('highlight.js');

// ============================================================================
// 1. 定义皮肤样式库 (CSS) - V7.3 修复列表颜色和间距
// ============================================================================
const THEMES = {
  // 默认：微信技术风 (优化版 - 适配深色/浅色背景)
  'wechat-tech': `
    /* 全局字体优化 */
    body { 
      font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; 
      line-height: 1.8; 
      font-size: 16px; 
      /* 确保全局默认文字是浅色，适配深色背景 */
      color: #f0f0f0; 
    }

    /* H1 主标题 */
    h1 { 
      font-size: 24px; 
      font-weight: 800; 
      margin: 35px 0 25px; 
      color: #f0f0f0; /* 改为浅色 */
      border-bottom: 2px solid #444; /* 深色背景下的分割线 */
      padding-bottom: 15px; 
    }

    /* H2 板块标题 (红框部分) - 极光蓝配色 */
    h2 { 
      font-size: 20px; 
      font-weight: bold; 
      margin: 40px 0 20px; 
      padding-left: 15px; 
      color: #1e80ff; 
      border-left: 5px solid #1e80ff; 
      background: linear-gradient(to right, rgba(30, 128, 255, 0.1), transparent);
      line-height: 1.4;
      border-radius: 0 4px 4px 0;
    }

    /* H3 小标题 */
    h3 { 
      font-size: 18px; 
      font-weight: bold; 
      margin: 25px 0 15px; 
      color: #1e80ff; 
    }

    /* 正文段落 */
    p { 
      margin-bottom: 18px; 
      text-align: justify; 
      letter-spacing: 0.5px; 
      opacity: 0.95; 
    }

    /* =========== 核心修复区域 Start =========== */
    /* 列表修复：颜色改为白色，并解决大间距问题 */
    ul, ol { 
      padding-left: 22px; 
      /* 【修复2】将列表底部的默认间距从 22px 减小到 10px */
      margin-bottom: 10px; 
      /* 【修复1】将字体颜色从深灰 #555 改为米白 #f0f0f0，解决看不清的问题 */
      color: #f0f0f0; 
    }
    /* 列表项内部的间距保持不变 */
    li { margin-bottom: 8px; }

    /* 【修复2加强版】如果 AI 生成了多个连续的独立列表，强制抵消它们之间的间距 */
    ul + ul, ol + ol, ul + ol, ol + ul {
        margin-top: -10px;
    }
    /* =========== 核心修复区域 End =========== */

    /* 重点文字 - 财经红 */
    strong { 
      color: #ff4d4f; 
      font-weight: bold; 
      margin: 0 2px; 
    }

    /* 链接样式 */
    a { 
      color: #1e80ff; 
      text-decoration: none; 
      border-bottom: 1px dashed rgba(30, 128, 255, 0.5); 
    }

    /* 引用块 */
    blockquote { 
      border-left: 4px solid #555; 
      background: rgba(255,255,255,0.05); /* 深色背景下的半透明白 */
      padding: 15px 20px; 
      color: #ccc; /* 引用文字颜色变浅 */
      margin: 25px 0; 
      border-radius: 4px;
    }

    /* 代码块高亮 */
    pre.hljs { 
      background: #1e1e1e; /* 更深的代码背景 */
      color: #abb2bf; 
      padding: 18px; 
      border-radius: 8px; 
      overflow-x: auto; 
      font-family: 'Menlo', monospace; 
      margin: 25px 0; 
      border: 1px solid #333;
    }
  `
};

// ============================================================================
// 2. 初始化 Markdown 解析器 (保持不变)
// ============================================================================
const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Please use POST.' });
  }

  try {
    const body = req.body || {};
    const content = body.content || "";
    const themeKey = body.theme || 'wechat-tech';

    if (!content.trim()) {
      return res.status(400).json({ error: 'Content is empty' });
    }

    const rawHtml = md.render(content);
    const css = THEMES[themeKey] || THEMES['wechat-tech'];
    const finalHtml = juice.inlineContent(rawHtml, css);

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
