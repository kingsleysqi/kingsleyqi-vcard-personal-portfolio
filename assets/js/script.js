'use strict';

// 导航栏切换
function initNavbar() {
  const pages = document.querySelectorAll('article');
  const navLinks = document.querySelectorAll("[data-nav-link]");
  navLinks.forEach(link => {
    link.addEventListener("click", function () {
      const targetPage = this.dataset.navLink;
      pages.forEach(page => {
        if (targetPage === page.dataset.page) {
          page.classList.add("active");
          this.classList.add("active");
          window.scrollTo(0, 0);
        } else {
          page.classList.remove("active");
          const otherLink = Array.from(navLinks).find(l => l.dataset.navLink === page.dataset.page);
          if (otherLink) otherLink.classList.remove("active");
        }
      });
    });
  });
}

// 表单验证
function initFormValidation() {
  const form = document.querySelector("[data-form]");
  const formInputs = document.querySelectorAll("[data-form-input]");
  const formBtn = document.querySelector("[data-form-btn]");
  if (!form || !formInputs.length) return;
  formInputs.forEach(input => {
    input.addEventListener("input", function () {
      if (form.checkValidity()) {
        formBtn.removeAttribute("disabled");
      } else {
        formBtn.setAttribute("disabled", "");
      }
    });
  });
}

// 带超时的 fetch
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// 加载 Markdown 文件
async function loadMarkdown(file, containerId, customRender = null, retries = 2) {
  const container = document.getElementById(containerId);
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetchWithTimeout(`content/${file}`, 5000);
      const text = await response.text();
      let html = marked.parse(text);
      if (customRender) html = customRender(html, text);
      container.innerHTML = html;
      return { html, text };
    } catch (err) {
      console.warn(`加载 ${file} 失败 (尝试 ${i+1}/${retries+1}):`, err);
      if (i === retries) {
        container.innerHTML = `<p style="color:#ff6b6b; padding:40px;">⚠️ 内容加载失败: ${file}<br>请检查网络或刷新页面重试</p>`;
        return null;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

let mdContents = { about: '', path: '', network: '', systems: '' };

// ========== About 页面渲染 ==========
function renderAbout(html, rawMarkdown) {
  const lines = rawMarkdown.split('\n');
  let enQuotes = [], zhQuotes = [];
  let inQuote = false;

  for (let line of lines) {
    if (line.includes('## 引言')) { inQuote = true; continue; }
    if (line.includes('## 关于我')) { inQuote = false; break; }
    if (inQuote && line.trim() && !line.startsWith('##')) {
      const l = line.trim();
      if (l.startsWith('Exit') || l.startsWith('Reject')) enQuotes.push(l);
      else if (l.startsWith('走出') || l.startsWith('拒绝')) zhQuotes.push(l);
    }
  }

  let quoteHtml = '';
  if (enQuotes.length || zhQuotes.length) {
    quoteHtml = `
      <div class="hero-quote">
        <div class="quote-box">
          ${enQuotes.map(q => `<p class="quote-en">${q}</p>`).join('')}
          ${zhQuotes.map(q => `<p class="quote-zh">${q}</p>`).join('')}
        </div>
      </div>
    `;
  }

  let aboutMarkdown = '';
  let inAbout = false;
  for (let line of lines) {
    if (line.includes('## 关于我')) { inAbout = true; continue; }
    if (line.startsWith('##') && inAbout) break;
    if (inAbout && line.trim()) aboutMarkdown += line + '\n';
  }
  if (!aboutMarkdown.trim()) aboutMarkdown = rawMarkdown;
  const aboutHtml = marked.parse(aboutMarkdown);
  mdContents.about = rawMarkdown;

  return `
    ${quoteHtml}
    <header><h2 class="h2 article-title">About Me</h2></header>
    <div class="about-text">${aboutHtml}</div>
    <div class="pdf-button-wrapper">
      <button class="export-pdf-btn" id="download-pdf">
        <ion-icon name="download-outline"></ion-icon>
        <span>导出 PDF</span>
      </button>
    </div>
  `;
}

// ========== Path 页面渲染（官方时间线卡片样式）==========
function renderPath(html, rawMarkdown) {
  const lines = rawMarkdown.split('\n');
  let education = [], experience = [], skills = [];
  let currentSection = '';
  let i = 0;

  while (i < lines.length) {
    let line = lines[i].trim();
    if (line.startsWith('## ')) {
      const title = line.substring(3);
      if (title.includes('学院时代')) currentSection = 'education';
      else if (title.includes('职场生涯')) currentSection = 'experience';
      else if (title.includes('专业技能')) currentSection = 'skills';
      else currentSection = '';
      i++;
      continue;
    }

    if (line.startsWith('- ') && currentSection !== 'skills') {
      let content = line.substring(2);
      let parts = content.split('|').map(p => p.trim());
      if (parts.length < 3) { i++; continue; }
      
      let zhTitle = parts[0];
      let zhPeriod = parts[1];
      let zhDesc = parts[2] || '';
      i++;

      let enTitle = '', enPeriod = '', enDesc = '';
      if (i < lines.length) {
        let next = lines[i].trim();
        if (next && !next.startsWith('-') && !next.startsWith('##')) {
          let enParts = next.split('|').map(p => p.trim());
          if (enParts.length >= 3) {
            enTitle = enParts[0];
            enPeriod = enParts[1];
            enDesc = enParts[2];
          } else {
            enTitle = next;
            i++;
            if (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('-') && !lines[i].trim().startsWith('##')) {
              enPeriod = lines[i].trim();
              i++;
              if (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('-') && !lines[i].trim().startsWith('##')) {
                enDesc = lines[i].trim();
                i++;
              }
            }
          }
          i++;
        }
      }

      if (currentSection === 'education') {
        education.push({ zh: { title: zhTitle, period: zhPeriod, desc: zhDesc }, en: { title: enTitle, period: enPeriod, desc: enDesc } });
      } else if (currentSection === 'experience') {
        experience.push({ zh: { title: zhTitle, period: zhPeriod, desc: zhDesc }, en: { title: enTitle, period: enPeriod, desc: enDesc } });
      }
    } else if (line.startsWith('- ') && currentSection === 'skills') {
      const match = line.substring(2).match(/^(.*?):\s*(\d+)%(?:\s*\|\s*(.*))?/);
      if (match) {
        const nameZh = match[1].trim();
        const level = parseInt(match[2], 10);
        const nameEn = match[3] ? match[3].trim() : '';
        skills.push({ nameZh, nameEn, level });
      }
      i++;
    } else {
      i++;
    }
  }

  // 教育部分
  let eduHTML = '';
  if (education.length) {
    eduHTML = `
      <div class="title-wrapper">
        <div class="icon-box"><ion-icon name="book-outline"></ion-icon></div>
        <div>
          <h3 class="h3">学院时代</h3>
          <p class="title-en">Academy Era</p>
        </div>
      </div>
      <ol class="timeline-list">
        ${education.map(item => `
          <li class="timeline-item">
            <h4 class="h4 timeline-item-title">${item.zh.title}</h4>
            <span>${item.zh.period}</span>
            <p class="timeline-text">${item.zh.desc}</p>
            ${item.en.title ? `<p class="timeline-item-en">${item.en.title} | ${item.en.period}</p>` : ''}
            ${item.en.desc ? `<p class="timeline-item-en">${item.en.desc}</p>` : ''}
          </li>
        `).join('')}
      </ol>
    `;
  }

  // 职场部分
  let expHTML = '';
  if (experience.length) {
    expHTML = `
      <div class="title-wrapper">
        <div class="icon-box"><ion-icon name="briefcase-outline"></ion-icon></div>
        <div>
          <h3 class="h3">职场生涯</h3>
          <p class="title-en">Career Experience</p>
        </div>
      </div>
      <ol class="timeline-list">
        ${experience.map(item => `
          <li class="timeline-item">
            <h4 class="h4 timeline-item-title">${item.zh.title}</h4>
            <span>${item.zh.period}</span>
            <p class="timeline-text">${item.zh.desc}</p>
            ${item.en.title ? `<p class="timeline-item-en">${item.en.title} | ${item.en.period}</p>` : ''}
            ${item.en.desc ? `<p class="timeline-item-en">${item.en.desc}</p>` : ''}
          </li>
        `).join('')}
      </ol>
    `;
  }

  // 技能部分
  let skillsHTML = '';
  if (skills.length) {
    skillsHTML = `
      <div class="title-wrapper">
        <div class="icon-box"><ion-icon name="code-outline"></ion-icon></div>
        <div>
          <h3 class="h3">专业技能</h3>
          <p class="title-en">Professional Skills</p>
        </div>
      </div>
      <ul class="skills-list content-card">
        ${skills.map(skill => `
          <li class="skills-item">
            <div class="title-wrapper" style="justify-content: space-between;">
              <div>
                <h5 class="h5">${skill.nameZh}</h5>
                ${skill.nameEn ? `<p class="skill-en">${skill.nameEn}</p>` : ''}
              </div>
              <data value="${skill.level}">${skill.level}%</data>
            </div>
            <div class="skill-progress-bg"><div class="skill-progress-fill" style="width: ${skill.level}%;"></div></div>
          </li>
        `).join('')}
      </ul>
    `;
  }

  mdContents.path = rawMarkdown;
  return `<header><h2 class="h2 article-title">人生轨迹</h2></header><div class="path-content">${eduHTML}${expHTML}${skillsHTML}</div>`;
}

// ========== Network 页面（自动从 MD 读取分类）==========
function renderNetwork(html, rawMarkdown) {
  const lines = rawMarkdown.split('\n');
  const projects = [];
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('- ')) {
      const content = line.substring(2);
      const parts = content.split('|').map(p => p.trim());
      if (parts.length >= 4) {
        const titleMatch = parts[0].match(/\[(.*?)\]\((.*?)\)/);
        const title = titleMatch ? titleMatch[1] : parts[0];
        const link = titleMatch ? titleMatch[2] : '#';
        const category = parts[1];
        const description = parts[2];
        const image = parts[3];
        projects.push({ title, link, category, description, image });
      }
    }
  }

  mdContents.network = rawMarkdown;
  const uniqueCats = [...new Set(projects.map(p => p.category))];
  const filterBtns = `
    <li class="filter-item"><button class="active" data-filter-btn data-filter="all">All</button></li>
    ${uniqueCats.map(cat => `<li class="filter-item"><button data-filter-btn data-filter="${cat}">${cat}</button></li>`).join('')}
  `;
  const selectOpts = `
    <li class="select-item"><button data-select-item data-filter="all">All</button></li>
    ${uniqueCats.map(cat => `<li class="select-item"><button data-select-item data-filter="${cat}">${cat}</button></li>`).join('')}
  `;
  const cards = projects.map(proj => `
    <li class="project-item active" data-filter-item data-category="${proj.category}">
      <a href="${proj.link}">
        <figure class="project-img"><div class="project-item-icon-box"><ion-icon name="eye-outline"></ion-icon></div><img src="${proj.image}" alt="${proj.title}" loading="lazy"></figure>
        <h3 class="project-title">${proj.title}</h3>
        <p class="project-category">${proj.description}</p>
      </a>
    </li>
  `).join('');

  return `
    <header><h2 class="h2 article-title">Kingsley Network</h2></header>
    <ul class="filter-list">${filterBtns}</ul>
    <div class="filter-select-box">
      <button class="filter-select" data-select><div class="select-value" data-select-value>Select category</div><div class="select-icon"><ion-icon name="chevron-down"></ion-icon></div></button>
      <ul class="select-list">${selectOpts}</ul>
    </div>
    <ul class="project-list">${cards}</ul>
  `;
}

// ========== Systems 页面 ==========
function renderSystems(html, rawMarkdown) {
  const lines = rawMarkdown.split('\n');
  const posts = [];
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('- ')) {
      const content = line.substring(2);
      const parts = content.split('|').map(p => p.trim());
      if (parts.length >= 5) {
        const titleMatch = parts[0].match(/\[(.*?)\]\((.*?)\)/);
        const title = titleMatch ? titleMatch[1] : parts[0];
        const link = titleMatch ? titleMatch[2] : '#';
        const category = parts[1];
        const date = parts[2];
        const description = parts[3];
        const image = parts[4];
        posts.push({ title, link, category, date, description, image });
      }
    }
  }

  mdContents.systems = rawMarkdown;
  return `
    <header><h2 class="h2 article-title">Systems & Infrastructure</h2></header>
    <ul class="blog-posts-list">
      ${posts.map(post => `
        <li class="blog-post-item">
          <a href="${post.link}">
            <figure class="blog-banner-box"><img src="${post.image}" alt="${post.title}" loading="lazy"></figure>
            <div class="blog-content">
              <div class="blog-meta"><p class="blog-category">${post.category}</p><span class="dot"></span><time datetime="${post.date.split('·')[0].trim()}">${post.date}</time></div>
              <h3 class="h3 blog-item-title">${post.title}</h3>
              <p class="blog-text">${post.description.substring(0, 200)}${post.description.length > 200 ? '...' : ''}</p>
            </div>
          </a>
        </li>
      `).join('')}
    </ul>
  `;
}

// ========== Contact 页面 ==========
function renderContact() {
  return `
    <header><h2 class="h2 article-title">Contact</h2></header>
    <div class="quote-box">
      <p><strong>Email:</strong> i@kingsleyqi.com</p>
      <p><strong>Phone:</strong> +63 960864508*</p>
      <p><strong>Location:</strong> Batangas, Philippines</p>
    </div>
  
  `;
}

// ========== PDF 导出 ==========
function initPDFExport() {
  const btn = document.getElementById('download-pdf');
  if (!btn) return;

  btn.addEventListener('click', async function() {
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ 生成预览中...';
    btn.disabled = true;

    try {
      const location = 'Batangas, Philippines';
      const sidebar = document.querySelector('.sidebar');
      let sidebarContent = '';
      if (sidebar) {
        const clone = sidebar.cloneNode(true);
        const moreBtn = clone.querySelector('.info_more-btn');
        if (moreBtn) moreBtn.remove();
        const socials = clone.querySelectorAll('.social-item');
        socials.forEach(s => s.remove());
        const contacts = clone.querySelectorAll('.contact-item');
        let contactsHTML = '';
        contacts.forEach(c => {
          const label = c.querySelector('.contact-title')?.innerText || '';
          const value = c.querySelector('.contact-link, time, address')?.innerText || '';
          if (label && value) contactsHTML += `<p><strong>${label}:</strong> ${value}</p>`;
        });
        sidebarContent = `<div class="sidebar-text"><div class="pdf-contacts">${contactsHTML}</div></div>`;
      }

      let aboutHtml = marked.parse(mdContents.about);
      let pathHtml = marked.parse(mdContents.path);
      let networkHtml = marked.parse(mdContents.network);
      let systemsHtml = marked.parse(mdContents.systems);

      const clean = (html) => {
        html = html.replace(/<img[^>]*>/g, '');
        html = html.replace(/<a[^>]*>([^<]*)<\/a>/g, '$1');
        html = html.replace(/\.\/assets\/images\/[^\s]+\.(jpg|png|svg)/g, '');
        return html;
      };
      aboutHtml = clean(aboutHtml);
      pathHtml = clean(pathHtml);
      networkHtml = clean(networkHtml);
      systemsHtml = clean(systemsHtml);

      const pdfPreview = `
        <!DOCTYPE html>
        <html>
          <head><meta charset="UTF-8"><title>Kingsley Qi - Resume</title>
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background: #fff; color: #1c1c1e; line-height:1.5; padding:48px 32px; max-width:900px; margin:0 auto;
            }
            .header { text-align:center; border-bottom:1px solid #e5e5ea; padding-bottom:24px; margin-bottom:32px; }
            .header h1 { font-size:36px; font-weight:700; color:#1c1c1e; margin-bottom:8px; }
            .header p { font-size:15px; color:#8e8e93; margin:4px 0; }
            .sidebar-text { margin-bottom:32px; }
            .pdf-contacts { margin-top:8px; padding-top:12px; border-top:1px solid #e5e5ea; }
            .pdf-contacts p { margin:6px 0; font-size:14px; color:#3a3a3c; }
            .section { margin-bottom:32px; }
            .section-title { font-size:22px; font-weight:600; margin:28px 0 16px; color:#1c1c1e; border-bottom:1px solid #e5e5ea; padding-bottom:6px; }
            .about-text p { margin-bottom:1em; }
            .about-text h1, .about-text h2, .about-text h3 { font-size:18px; font-weight:600; margin:24px 0 12px; color:#1c1c1e; }
            .about-text strong { font-weight:600; }
            .about-text ul, .about-text ol { margin:12px 0 16px 28px; }
            .timeline-list { margin-left:24px; list-style:none; }
            .timeline-item { margin-bottom:20px; }
            .timeline-item h4 { font-size:16px; font-weight:600; margin-bottom:4px; }
            .timeline-item span { font-size:13px; color:#8e8e93; display:block; margin-bottom:6px; }
            .timeline-text { font-size:14px; color:#3a3a3c; }
            .timeline-item-en { font-size:13px; color:#8e8e93; margin-top:6px; }
            .skills-list { list-style:none; padding:0; }
            .skills-item { margin:14px 0; }
            .skills-item .title-wrapper { display:flex; justify-content:space-between; margin-bottom:4px; }
            .skill-progress-bg { background:#e5e5ea; height:4px; border-radius:2px; overflow:hidden; }
            .skill-progress-fill { background:#1c1c1e; height:100%; border-radius:2px; }
            .project-list, .blog-posts-list { display:flex; flex-direction:column; gap:20px; list-style:none; padding:0; }
            .project-item, .blog-post-item { border:none; border-bottom:1px solid #e5e5ea; padding-bottom:20px; }
            .project-img img, .blog-banner-box img { width:100%; height:auto; max-height:160px; object-fit:cover; border-radius:8px; margin-bottom:12px; }
            .project-title, .blog-item-title { font-size:17px; font-weight:600; margin:0 0 8px; }
            .project-category, .blog-category { font-size:13px; color:#8e8e93; margin-bottom:8px; }
            .blog-text { font-size:14px; color:#3a3a3c; }
            .quote-box { background: rgba(255,219,112,0.05); border: 1px solid rgba(255,219,112,0.2); border-radius: 16px; padding: 20px; text-align: center; margin: 20px 0; }
            .quote-box p { color: #3a3a3c; margin: 8px 0; }
            .quote-box strong { color: #ffdb70; }
            .footer { margin-top:48px; padding-top:20px; border-top:1px solid #e5e5ea; text-align:center; font-size:12px; color:#8e8e93; }
            .pdf-actions { position:fixed; bottom:24px; right:24px; display:flex; gap:12px; z-index:1000; }
            .pdf-actions button { padding:8px 20px; border:none; border-radius:30px; font-size:13px; font-weight:500; cursor:pointer; background:#f2f2f5; color:#1c1c1e; transition:0.2s; }
            .pdf-actions button:hover { background:#e5e5ea; }
            @media print { .pdf-actions { display:none; } body { padding:20px; } }
          </style>
          </head>
          <body>
            <div class="header"><h1>KINGSLEY QI</h1><p>工业自动化 × IT基础设施 × 系统解决方案</p><p>Industrial Automation × IT Infrastructure × System Solutions</p></div>
            ${sidebarContent}
            <div class="section"><div class="section-title">About Me</div><div class="about-text">${aboutHtml}</div></div>
            <div class="section"><div class="section-title">人生轨迹</div><div class="path-content">${pathHtml}</div></div>
            <div class="section"><div class="section-title">Kingsley Network</div>${networkHtml}</div>
            <div class="section"><div class="section-title">Systems & Infrastructure</div>${systemsHtml}</div>
            <div class="footer"><p>📍 ${location} | i@kingsleyqi.com | +63 960864508*</p><p>Me.Kingsleyqi.com · Kingsleyqi.com · Kingsleyqi.cn</p><p>Kingsley Qi · 2026</p></div>
            <div class="pdf-actions"><button class="btn-print" onclick="window.print();">📄 保存为 PDF</button><button class="btn-close" onclick="window.close();">✖ 关闭预览</button></div>
          </body>
        </html>
      `;

      const w = window.open('', '_blank');
      w.document.write(pdfPreview);
      w.document.close();
      btn.innerHTML = '✓ 预览已打开';
      setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 2000);
    } catch (err) {
      console.error(err);
      btn.innerHTML = '✗ 失败';
      btn.disabled = false;
      setTimeout(() => { btn.innerHTML = originalText; }, 1500);
      alert('PDF生成失败: ' + err.message);
    }
  });
}

// ========== Network 筛选 ==========
function initFilters() {
  const select = document.querySelector("[data-select]");
  const selectItems = document.querySelectorAll("[data-select-item]");
  const selectValue = document.querySelector("[data-select-value]");
  const filterBtn = document.querySelectorAll("[data-filter-btn]");
  const filterItems = document.querySelectorAll("[data-filter-item]");
  if (!select || !selectItems.length) return;

  select.addEventListener("click", function () {
    this.classList.toggle("active");
  });

  const filterFunc = function (selectedValue) {
    filterItems.forEach(item => {
      const category = item.dataset.category;
      if (selectedValue === "all" || selectedValue === category) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  };

  selectItems.forEach(item => {
    item.addEventListener("click", function () {
      let value = this.dataset.filter;
      selectValue.innerText = this.innerText;
      select.classList.remove("active");
      filterFunc(value);
    });
  });

  let lastClickedBtn = filterBtn[0];
  filterBtn.forEach(btn => {
    btn.addEventListener("click", function () {
      let selectedValue = this.dataset.filter;
      selectValue.innerText = this.innerText;
      filterFunc(selectedValue);
      lastClickedBtn.classList.remove("active");
      this.classList.add("active");
      lastClickedBtn = this;
    });
  });
}

// ========== 加载所有内容 ==========
async function loadAllContent() {
  const containers = ['about-container', 'path-container', 'network-container', 'systems-container', 'contact-container'];
  containers.forEach(id => {
    const el = document.getElementById(id);
    if (el && (!el.innerHTML || el.innerHTML.includes('加载失败'))) {
      el.innerHTML = '<div class="loading-tip">加载中...</div>';
    }
  });

  await loadMarkdown('about.md', 'about-container', renderAbout);
  await loadMarkdown('path.md', 'path-container', renderPath);
  await loadMarkdown('network.md', 'network-container', renderNetwork);
  await loadMarkdown('systems.md', 'systems-container', renderSystems);
  document.getElementById('contact-container').innerHTML = renderContact();

  setTimeout(() => {
    initNavbar();
    initFormValidation();
    initFilters();
    initPDFExport();
  }, 100);
}

loadAllContent();