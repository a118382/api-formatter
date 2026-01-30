const MarkdownIt = require('markdown-it');
const juice = require('juice');
const hljs = require('highlight.js');

// ============================================================================
// 1. 定义皮肤样式库 (CSS) - 已优化美感
// ============================================================================
const THEMES = {
  // 默认：微信技术风 (优化版 - 适配深色/浅色背景)
  'wechat-tech': `
    /* 全局字体优化，增加呼吸感 */
    body { 
      font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; 
      line-height: 1.8; 
      font-size: 16px; 
      color: #333; /* 默认深灰，WP深色主题通常会自动反转这个，或者你可以改为 #e0e0e0 强制浅色 */
    }

    /* H1 主标题 - 沉稳大气 */
    h1 { 
      font-size: 24px; 
      font-weight: 800; 
      margin: 35px 0 25px; 
      color: #333; 
      border-bottom: 2px solid #eaeaea; 
      padding-bottom: 15px; 
    }

    /* H2 板块标题 (您要求的红框部分) - 极光蓝配色 */
    h2 { 
      font-size: 20px; 
      font-weight: bold; 
      margin: 40px 0 20px; 
      padding-left: 15px; 
      
      /* 核心修改：改为高亮科技蓝，在深色背景下非常漂亮 */
      color: #1e80ff; 
      
      /* 核心修改：左侧竖杠，加粗，同色 */
      border-left: 5px solid #1e80ff; 
      
      /* 增加一点微弱的背景色，让标题条更像一个Banner (可选，增加层次感) */
      background: linear-gradient(to right, rgba(30, 128, 255, 0.05), transparent);
      line-height: 1.4;
      border-radius: 0 4px 4px 0;
    }

    /* H3 小标题 */
    h3 { 
      font-size: 18px; 
      font-weight: bold; 
      margin: 25px 0 15px; 
      color: #1e80ff; /* 与 H2 呼应 */
    }

    /* 正文段落 - 两端对齐，阅读舒适 */
    p { 
      margin-bottom: 18px; 
      text-align: justify; 
      letter-spacing: 0.5px; 
      opacity: 0.9; /* 稍微柔和一点 */
    }

    /* 列表 - 增加缩进 */
    ul, ol { 
      padding-left: 22px; 
      margin-bottom: 22px; 
      color: #555; 
    }
    li { margin-bottom: 8px; }

    /* 重点文字 - 财经红 (用于跌幅/上涨数据) */
    strong { 
      color: #ff4d4f; /* 鲜艳的红色，强调数据 */
      font-weight: bold; 
      margin: 0 2px; /* 增加一点左右间距，防粘连 */
    }

    /* 链接样式 */
    a { 
      color: #1e80ff; 
      text-decoration: none; 
      border-bottom: 1px dashed rgba(30, 128, 255, 0.5); 
    }

    /* 引用块 - 灰色背景 */
    blockquote { 
      border-left: 4px solid #ddd; 
      background: rgba(0,0,0,0.03); 
      padding: 15px 20px; 
      color: #666; 
      margin: 25px 0; 
      border-radius: 4px;
    }

    /* 代码块高亮 */
    pre.hljs { 
      background: #282c34; 
      color: #abb2bf; 
      padding: 18px; 
      border-radius: 8px; 
      overflow-x: auto; 
      font-family: 'Menlo', monospace; 
      margin: 25px 0; 
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
