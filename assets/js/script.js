'use strict';

const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }

marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false
});

async function loadMarkdown(file, containerId, customRender = null) {
  try {
    const response = await fetch(`content/${file}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    let html = marked.parse(text);
    if (customRender) {
      html = customRender(html, text);
    }
    document.getElementById(containerId).innerHTML = html;
    return { html, text };
  } catch (err) {
    console.error(err);
    document.getElementById(containerId).innerHTML = `<p style="color:#ff6b6b; padding:40px; text-align:center;">加载失败: ${file}</p>`;
    return null;
  }
}

// ========== 存储所有 MD 文件原始内容 ==========
let mdContents = {
  about: '',
  path: '',
  network: '',
  systems: ''
};

// ========== 获取当前地理位置 ==========
function getLocation() {
  return 'Batangas, Philippines';
}

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

// ========== Path 页面渲染 ==========
function renderPath(html, rawMarkdown) {
  const lines = rawMarkdown.split('\n');
  let education = [], experience = [], skills = [];
  let currentSection = '';

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('## ')) {
      const title = line.substring(3);
      if (title.includes('学院时代')) currentSection = 'education';
      else if (title.includes('职场生涯')) currentSection = 'experience';
      else if (title.includes('专业技能')) currentSection = 'skills';
      else currentSection = '';
    } else if (line.startsWith('- ') && currentSection) {
      const content = line.substring(2);
      if (currentSection === 'education') {
        const parts = content.split('|').map(p => p.trim());
        if (parts.length >= 3) education.push({ title: parts[0], period: parts[1], desc: parts[2] });
      } else if (currentSection === 'experience') {
        const parts = content.split('|').map(p => p.trim());
        if (parts.length >= 3) experience.push({ title: parts[0], period: parts[1], desc: parts[2] });
      } else if (currentSection === 'skills') {
        const match = content.match(/^(.*?):\s*(\d+)%/);
        if (match) skills.push({ name: match[1], level: parseInt(match[2], 10) });
      }
    }
  }

  let eduHTML = '', expHTML = '', skillsHTML = '';
  
  if (education.length) {
    eduHTML = `
      <div class="title-wrapper">
        <h3 class="h3">学院时代</h3>
      </div>
      <ol class="timeline-list">
        ${education.map(item => `<li class="timeline-item"><h4 class="h4 timeline-item-title">${item.title}</h4><span>${item.period}</span><p class="timeline-text">${item.desc}</p></li>`).join('')}
      </ol>
    `;
  }
  
  if (experience.length) {
    expHTML = `
      <div class="title-wrapper">
        <h3 class="h3">职场生涯</h3>
      </div>
      <ol class="timeline-list">
        ${experience.map(item => `<li class="timeline-item"><h4 class="h4 timeline-item-title">${item.title}</h4><span>${item.period}</span><p class="timeline-text">${item.desc}</p></li>`).join('')}
      </ol>
    `;
  }
  
  if (skills.length) {
    skillsHTML = `
      <h3 class="h3 skills-title">专业技能</h3>
      <ul class="skills-list">
        ${skills.map(skill => `<li class="skills-item"><div class="title-wrapper"><h5 class="h5">${skill.name}</h5><data value="${skill.level}">${skill.level}%</data></div><div class="skill-progress-bg"><div class="skill-progress-fill" style="width: ${skill.level}%;"></div></div></li>`).join('')}
      </ul>
    `;
  }

  mdContents.path = rawMarkdown;

  return `<header><h2 class="h2 article-title">人生轨迹</h2></header><div class="path-content">${eduHTML}${expHTML}${skillsHTML}</div>`;
}

// ========== Network 页面 ==========
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

  const uniqueCategories = [...new Set(projects.map(p => p.category))];
  const filterButtons = `
    <li class="filter-item"><button class="active" data-filter-btn data-filter="all">全部 / All</button></li>
    ${uniqueCategories.map(cat => `
      <li class="filter-item"><button data-filter-btn data-filter="${cat}">${cat}</button></li>
    `).join('')}
  `;
  
  const selectOptions = `
    <li class="select-item"><button data-select-item data-filter="all">全部 / All</button></li>
    ${uniqueCategories.map(cat => `
      <li class="select-item"><button data-select-item data-filter="${cat}">${cat}</button></li>
    `).join('')}
  `;
  
  const projectCards = projects.map(proj => `
    <li class="project-item active" data-filter-item data-category="${proj.category}">
      <a href="${proj.link}">
        <figure class="project-img">
          <div class="project-item-icon-box"><ion-icon name="eye-outline"></ion-icon></div>
          <img src="${proj.image}" alt="${proj.title}" loading="lazy">
        </figure>
        <h3 class="project-title">${proj.title}</h3>
        <p class="project-category">${proj.description}</p>
      </a>
    </li>
  `).join('');
  
  return `
    <header><h2 class="h2 article-title">Kingsley Network</h2></header>
    <ul class="filter-list">${filterButtons}</ul>
    <div class="filter-select-box">
      <button class="filter-select" data-select>
        <div class="select-value" data-select-value>选择分类 / Select category</div>
        <div class="select-icon"><ion-icon name="chevron-down"></ion-icon></div>
      </button>
      <ul class="select-list">${selectOptions}</ul>
    </div>
    <ul class="project-list">${projectCards}</ul>
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

  return `<header><h2 class="h2 article-title">Systems & Infrastructure</h2></header><ul class="blog-posts-list">${posts.map(post => `
    <li class="blog-post-item">
      <a href="${post.link}">
        <figure class="blog-banner-box"><img src="${post.image}" alt="${post.title}" loading="lazy"></figure>
        <div class="blog-content">
          <div class="blog-meta">
            <p class="blog-category">${post.category}</p>
            <span class="dot"></span>
            <time datetime="${post.date.split('·')[0].trim()}">${post.date}</time>
          </div>
          <h3 class="h3 blog-item-title">${post.title}</h3>
          <p class="blog-text">${post.description.substring(0, 200)}${post.description.length > 200 ? '...' : ''}</p>
        </div>
      </a>
    </li>
  `).join('')}</ul>`;
}

// ========== Contact 页面 ==========
function renderContact() {
  return `
    <header><h2 class="h2 article-title">Contact</h2></header>
    <section class="contact-form">
      <form action="#" class="form" data-form>
        <div class="input-wrapper">
          <input type="text" name="fullname" class="form-input" placeholder="Full name" required data-form-input>
          <input type="email" name="email" class="form-input" placeholder="Email address" required data-form-input>
        </div>
        <textarea name="message" class="form-input" placeholder="Your Message" required data-form-input></textarea>
        <button class="form-btn" type="submit" disabled data-form-btn>
          <ion-icon name="paper-plane"></ion-icon>
          <span>Send Message</span>
        </button>
      </form>
    </section>
  `;
}

// ========== PDF 专用的侧边栏内容 ==========
function getPDFSidebarContent(rawSidebarHTML) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = rawSidebarHTML;
  
  // 移除所有图片
  const images = tempDiv.querySelectorAll('img');
  images.forEach(img => img.remove());
  
  // 移除所有社交链接元素
  const socialItems = tempDiv.querySelectorAll('.social-item');
  socialItems.forEach(item => item.remove());
  
  // 提取联系方式文本
  const contacts = [];
  const contactItems = tempDiv.querySelectorAll('.contact-item');
  contactItems.forEach(item => {
    const label = item.querySelector('.contact-title')?.innerText || '';
    const value = item.querySelector('.contact-link, time, address')?.innerText || '';
    if (label && value) contacts.push({ label, value });
  });
  
  let contactsHTML = '';
  if (contacts.length) {
    contactsHTML = contacts.map(c => `<p><strong>${c.label}:</strong> ${c.value}</p>`).join('');
  }
  
  return `
    <div class="sidebar-text">
      <div class="pdf-contacts">
        ${contactsHTML}
      </div>
    </div>
  `;
}

// ========== 彻底清理 HTML 中的图片和链接 ==========
function cleanHtml(html) {
  // 移除所有 img 标签
  html = html.replace(/<img[^>]*>/g, '');
  // 移除所有 a 标签，保留文本
  html = html.replace(/<a[^>]*>([^<]*)<\/a>/g, '$1');
  // 移除所有 src 和 href 属性
  html = html.replace(/\s*(src|href)=["'][^"']*["']/g, '');
  return html;
}

// ========== 加载所有内容 ==========
async function loadAllContent() {
  await loadMarkdown('about.md', 'about-container', renderAbout);
  await loadMarkdown('path.md', 'path-container', renderPath);
  await loadMarkdown('network.md', 'network-container', renderNetwork);
  await loadMarkdown('systems.md', 'systems-container', renderSystems);
  document.getElementById('contact-container').innerHTML = renderContact();
  
  setTimeout(() => {
    initFilters();
    initFormValidation();
    initNavbar();
    initPDFExport();
  }, 200);
}

// ========== 导航栏 ==========
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
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          page.classList.remove("active");
          const otherLink = Array.from(navLinks).find(l => l.dataset.navLink === page.dataset.page);
          if (otherLink) otherLink.classList.remove("active");
        }
      });
    });
  });
}

// ========== 筛选 ==========
function initFilters() {
  const select = document.querySelector("[data-select]");
  const selectItems = document.querySelectorAll("[data-select-item]");
  const selectValue = document.querySelector("[data-select-value]");
  const filterBtn = document.querySelectorAll("[data-filter-btn]");
  const filterItems = document.querySelectorAll("[data-filter-item]");
  if (!select || !selectItems.length) return;
  
  select.addEventListener("click", function () { elementToggleFunc(this); });
  
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
      elementToggleFunc(select);
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

// ========== 表单验证 ==========
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

// ========== PDF 导出 ==========
function initPDFExport() {
  const btn = document.getElementById('download-pdf');
  if (!btn) return;
  
  btn.addEventListener('click', async function() {
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ 生成预览中...';
    btn.disabled = true;
    
    try {
      const location = getLocation();
      
      // 获取侧边栏内容
      const currentSidebar = document.querySelector('.sidebar');
      const rawSidebarHTML = currentSidebar ? currentSidebar.innerHTML : '';
      const sidebarContent = getPDFSidebarContent(rawSidebarHTML);
      
      // 渲染各部分内容并清理
      let aboutHtml = marked.parse(mdContents.about);
      let pathHtml = marked.parse(mdContents.path);
      let networkHtml = marked.parse(mdContents.network);
      let systemsHtml = marked.parse(mdContents.systems);
      
      // 清理所有图片和链接
      aboutHtml = cleanHtml(aboutHtml);
      pathHtml = cleanHtml(pathHtml);
      networkHtml = cleanHtml(networkHtml);
      systemsHtml = cleanHtml(systemsHtml);
      
      // 额外清理可能残留的图片路径文本
      const cleanText = (text) => {
        return text.replace(/\.\/assets\/images\/[^\s]+\.(jpg|png|svg)/g, '')
                   .replace(/http[s]?:\/\/[^\s]+\.(jpg|png|svg)/g, '')
                   .replace(/\[[^\]]*\]\([^)]*\)/g, '');
      };
      
      aboutHtml = cleanText(aboutHtml);
      pathHtml = cleanText(pathHtml);
      networkHtml = cleanText(networkHtml);
      systemsHtml = cleanText(systemsHtml);
      
      // PDF 模板（只有一条分割线）
      const pdfPreview = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Kingsley Qi - Resume</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              } 
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background: #ffffff;
                color: #1c1c1e;
                line-height: 1.5;
                padding: 48px 32px;
                max-width: 900px;
                margin: 0 auto;
              }
              h1, h2, h3, h4 {
                font-weight: 600;
                letter-spacing: -0.02em;
              }
              .header {
                text-align: center;
                border-bottom: 1px solid #e5e5ea;
                padding-bottom: 24px;
                margin-bottom: 32px;
              }
              .header h1 {
                font-size: 36px;
                font-weight: 700;
                color: #1c1c1e;
                margin-bottom: 8px;
              }
              .header p {
                font-size: 15px;
                color: #8e8e93;
                margin: 4px 0;
              }
              .sidebar-text {
                margin-bottom: 32px;
              }
              .pdf-contacts {
                margin-top: 8px;
                padding-top: 12px;
                border-top: 1px solid #e5e5ea;
              }
              .pdf-contacts p {
                margin: 6px 0;
                font-size: 14px;
                color: #3a3a3c;
              }
              .section {
                margin-bottom: 32px;
              }
              .section-title {
                font-size: 22px;
                font-weight: 600;
                margin: 28px 0 16px;
                color: #1c1c1e;
                border-bottom: 1px solid #e5e5ea;
                padding-bottom: 6px;
              }
              .about-text p {
                margin-bottom: 1em;
              }
              .about-text h1, .about-text h2, .about-text h3 {
                font-size: 18px;
                font-weight: 600;
                margin: 24px 0 12px;
                color: #1c1c1e;
              }
              .about-text strong {
                font-weight: 600;
              }
              .about-text ul, .about-text ol {
                margin: 12px 0 16px 28px;
              }
              .about-text li {
                margin: 6px 0;
              }
              .title-wrapper {
                margin: 20px 0 12px;
              }
              .title-wrapper h3 {
                font-size: 18px;
                font-weight: 600;
              }
              .timeline-list {
                margin-left: 24px;
                list-style: none;
              }
              .timeline-item {
                margin-bottom: 20px;
              }
              .timeline-item h4 {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 4px;
              }
              .timeline-item span {
                font-size: 13px;
                color: #8e8e93;
                display: block;
                margin-bottom: 6px;
              }
              .timeline-text {
                font-size: 14px;
                color: #3a3a3c;
              }
              .skills-list {
                list-style: none;
                padding: 0;
              }
              .skills-item {
                margin: 14px 0;
              }
              .skills-item .title-wrapper {
                margin: 0 0 4px;
                display: flex;
                justify-content: space-between;
              }
              .skill-progress-bg {
                background: #e5e5ea;
                height: 4px;
                border-radius: 2px;
                overflow: hidden;
              }
              .skill-progress-fill {
                background: #1c1c1e;
                height: 100%;
                border-radius: 2px;
              }
              .project-list, .blog-posts-list {
                display: flex;
                flex-direction: column;
                gap: 20px;
                list-style: none;
                padding: 0;
              }
              .project-item, .blog-post-item {
                border: none;
                border-bottom: 1px solid #e5e5ea;
                padding-bottom: 20px;
              }
              .project-title, .blog-item-title {
                font-size: 17px;
                font-weight: 600;
                margin: 0 0 8px;
              }
              .project-category, .blog-category {
                font-size: 13px;
                color: #8e8e93;
                margin-bottom: 8px;
              }
              .blog-text {
                font-size: 14px;
                color: #3a3a3c;
              }
              .footer {
                margin-top: 48px;
                padding-top: 20px;
                border-top: 1px solid #e5e5ea;
                text-align: center;
                font-size: 12px;
                color: #8e8e93;
              }
              .pdf-actions {
                position: fixed;
                bottom: 24px;
                right: 24px;
                display: flex;
                gap: 12px;
                z-index: 1000;
              }
              .pdf-actions button {
                padding: 8px 20px;
                border: none;
                border-radius: 30px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                background: #f2f2f5;
                color: #1c1c1e;
                transition: 0.2s;
              }
              .pdf-actions button:hover {
                background: #e5e5ea;
              }
              @media print {
                .pdf-actions {
                  display: none;
                }
                body {
                  padding: 20px;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>KINGSLEY QI</h1>
              <p>自动化 & IT工程师</p>
              <p>Automation Engineer | Architect | IT Engineer</p>
            </div>
            
            ${sidebarContent}
            
            <div class="section">
              <div class="section-title">About Me</div>
              <div class="about-text">${aboutHtml}</div>
            </div>
            
            <div class="section">
              <div class="section-title">人生轨迹</div>
              <div class="path-content">${pathHtml}</div>
            </div>
            
            <div class="section">
              <div class="section-title">Kingsley Network</div>
              ${networkHtml}
            </div>
            
            <div class="section">
              <div class="section-title">Systems & Infrastructure</div>
              ${systemsHtml}
            </div>
            
            <div class="footer">
              <p>📍 ${location} | i@kingsleyqi.com | +63 960864508*</p>
              <p>Me.Kingsleyqi.com · Kingsleyqi.com · Kingsleyqi.cn</p>
              <p>Kingsley Qi · 2026</p>
            </div>
            
            <div class="pdf-actions">
              <button class="btn-print" onclick="window.print();">📄 保存为 PDF</button>
              <button class="btn-close" onclick="window.close();">✖ 关闭预览</button>
            </div>
          </body>
        </html>
      `;
      
      const previewWindow = window.open('', '_blank');
      previewWindow.document.write(pdfPreview);
      previewWindow.document.close();
      
      btn.innerHTML = '✓ 预览已打开';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 2000);
      
    } catch (err) {
      console.error('PDF 生成失败:', err);
      btn.innerHTML = '✗ 失败';
      btn.disabled = false;
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 1500);
      alert('PDF 生成失败: ' + err.message);
    }
  });
}

loadAllContent();