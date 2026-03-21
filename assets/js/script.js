'use strict';

const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }

// 1. Sidebar 逻辑
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");
sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });

// 2. Testimonials 逻辑 (保持原样，增加防御检查)
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

const testimonialsModalFunc = function () {
  modalContainer.classList.toggle("active");
  overlay.classList.toggle("active");
}


if (testimonialsItem.length > 0) {
  for (let i = 0; i < testimonialsItem.length; i++) {
    testimonialsItem[i].addEventListener("click", function () {
      modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
      modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
      modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
      modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;
      testimonialsModalFunc();
    });
  }
}
modalCloseBtn.addEventListener("click", testimonialsModalFunc);
overlay.addEventListener("click", testimonialsModalFunc);

// 3. 筛选逻辑修正 (重点)
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-select-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");
const filterItems = document.querySelectorAll("[data-filter-item]");

select.addEventListener("click", function () { elementToggleFunc(this); });

const filterFunc = function (selectedValue) {
  for (let i = 0; i < filterItems.length; i++) {
    const category = filterItems[i].dataset.category;
    if (selectedValue === "all" || selectedValue === category) {
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }
  }
}

// 下拉菜单项点击
for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function () {
    let value = this.dataset.filter; // 获取 data-filter 属性
    selectValue.innerText = this.innerText;
    elementToggleFunc(select);
    filterFunc(value);
  });
}

// 桌面端按钮点击
let lastClickedBtn = filterBtn[0];
for (let i = 0; i < filterBtn.length; i++) {
  filterBtn[i].addEventListener("click", function () {
    let selectedValue = this.dataset.filter;
    selectValue.innerText = this.innerText;
    filterFunc(selectedValue);
    lastClickedBtn.classList.remove("active");
    this.classList.add("active");
    lastClickedBtn = this;
  });
}

// 4. 表单验证
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }
  });
}

// 5. 导航逻辑修正 (提高容错率)
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    // 强制转换为小写并去除空格
    const targetPage = this.innerText.trim().toLowerCase();
    
    for (let j = 0; j < pages.length; j++) {
      if (targetPage === pages[j].dataset.page) {
        pages[j].classList.add("active");
        navigationLinks[j].classList.add("active");
        window.scrollTo(0, 0);
      } else {
        pages[j].classList.remove("active");
        navigationLinks[j].classList.remove("active");
      }
    }
  });
}


document.getElementById('download-pdf').addEventListener('click', async function() {
  const btn = this;
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ 生成简洁美观版 PDF...';
  btn.disabled = true;

  try {
    // 确保 jsPDF 已加载（如果没加，动态加载）
    if (typeof jspdf === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      document.head.appendChild(script);
      await new Promise(r => { script.onload = r; });
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    });

    // 尝试调用系统常见中文字体（按顺序 fallback）
doc.setFont("helvetica"); // 默认英文
// 如果浏览器支持，以下可能生效（测试时看 PDF 是否有中文）
// doc.setFont("SimSun", "normal");       // Windows 宋体
// doc.setFont("Microsoft YaHei", "normal"); // Windows 微软雅黑
// doc.setFont("PingFang SC", "normal");   // macOS/iOS 苹方
// doc.setFont("Noto Sans CJK SC", "normal"); // Android/Chrome 常见

    let y = 20; // 当前 Y 坐标

    // 标题
    doc.setFontSize(24);
    doc.setTextColor(220, 90, 0); // 橙色
    doc.text('KINGSLEY QI', 105, y, { align: 'center' });
    y += 12;

    doc.setFontSize(14);
    doc.setTextColor(80);
    doc.text('自动化工程师 | 架构师 | IT工程师', 105, y, { align: 'center' });
    doc.text('Automation Engineer • Architect • IT Engineer', 105, y + 6, { align: 'center' });
    y += 18;

    // 分隔线
    doc.setLineWidth(0.5);
    doc.setDrawColor(251, 191, 36);
    doc.line(20, y, 190, y);
    y += 12;

    // 联系方式
    doc.setFontSize(14);
    doc.setTextColor(220, 90, 0);
    doc.text('联系方式', 20, y);
    y += 8;

    doc.setFontSize(12);
    doc.setTextColor(0);
    const contacts = [
      `Email: i@kingsleyqi.com`,
      `Phone: +63 960864508*`,
      `Birthday: Aug 29, 1992`,
      `Location: Batangas, Philippines`
    ];
    contacts.forEach(line => {
      doc.text(line, 25, y);
      y += 7;
    });
    y += 10;

    // 核心能力 / About
    doc.setFontSize(14);
    doc.setTextColor(220, 90, 0);
    doc.text('核心能力 & 关于我', 20, y);
    y += 8;

    doc.setFontSize(11);
    doc.setTextColor(40);
    const aboutText = document.querySelector('.about-text')?.innerText.trim() || '专注工业自动化、工业物联网与办公自动化 15 年+...（内容已提取）';
    const aboutLines = doc.splitTextToSize(aboutText, 170); // 自动换行，宽度170mm
    doc.text(aboutLines, 20, y);
    y += aboutLines.length * 6 + 10; // 估算高度

    // 项目列表（简化版）
    doc.setFontSize(14);
    doc.setTextColor(220, 90, 0);
    doc.text('代表项目', 20, y);
    y += 8;

    doc.setFontSize(11);
    const projects = document.querySelectorAll('.blog-post-item');
    projects.forEach((proj, i) => {
      if (y > 270) { // 接近页底，换页
        doc.addPage();
        y = 20;
      }
      const title = proj.querySelector('.blog-item-title')?.innerText.trim() || '';
      const desc = proj.querySelector('.blog-text')?.innerText.trim().substring(0, 200) + '...' || '';
      doc.setTextColor(0);
      doc.text(`${i+1}. ${title}`, 20, y);
      y += 7;
      const descLines = doc.splitTextToSize(desc, 160);
      doc.text(descLines, 25, y);
      y += descLines.length * 6 + 10;
    });

    // 页脚
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text('Generated from Kingsley Qi Portfolio • 2026', 105, 290, { align: 'center' });

    doc.save('Kingsley_Qi_专业简历.pdf');

    btn.innerHTML = '✅ 下载完成！';
    setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 3000);

  } catch (err) {
    console.error('PDF 生成失败：', err);
    btn.innerHTML = '❌ 失败，重试';
    btn.disabled = false;
    alert('生成出错：' + err.message + '\n请检查控制台，或用下面备用方案');
  }
});