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


// ============ 最终稳定版 PDF（复制替换旧的）============
document.getElementById('download-pdf').addEventListener('click', async function() {
  const btn = this;
  const oldHTML = btn.innerHTML;
  btn.innerHTML = '⏳ 生成中（请稍等10秒）...';
  btn.disabled = true;

  try {
    // 双重保险加载
    if (typeof html2pdf === 'undefined') {
      const s = document.createElement('script');
      s.src = 'https://cdn.bootcdn.net/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      document.head.appendChild(s);
      await new Promise(r => s.onload = r);
    }

    const fullResume = `
      <div style="font-family:Poppins,sans-serif;padding:40px 50px;background:#fff;color:#1f2937;line-height:1.75;max-width:800px;margin:20px auto;border:1px solid #e5e7eb;">
        <h1 style="text-align:center;color:#ea580c;font-size:42px;margin:0;">KINGSLEY QI</h1>
        <p style="text-align:center;font-size:19px;color:#64748b;">自动化工程师 | 架构师 | IT工程师<br>现居菲律宾八大雁省</p>
        <hr style="border:3px solid #f97316;margin:30px 0;">
        ${document.querySelector('.about-text').outerHTML}
        ${document.querySelectorAll('.timeline, .skill, .blog-posts-list').length ? 
          Array.from(document.querySelectorAll('.timeline, .skill, .blog-posts-list')).map(e => e.outerHTML).join('') : ''}
        <p style="text-align:center;margin-top:40px;color:#64748b;">© 2026 Kingsley Qi • 完整档案导出</p>
      </div>`;

    await html2pdf()
      .set({
        margin: 15,
        filename: 'Kingsley_Qi_完整简历_2026.pdf',
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      })
      .from(fullResume)
      .save();

    btn.innerHTML = '✅ 下载完成！';
    setTimeout(() => { btn.innerHTML = oldHTML; btn.disabled = false; }, 4000);

  } catch (err) {
    console.error("PDF错误：", err);
    alert("PDF生成失败\n请按 F12 → Console 截图发给我，我继续帮你");
    btn.innerHTML = '❌ 重试';
    btn.disabled = false;
  }
});