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


// ============ 优化后的 PDF 导出（直接替换原代码）============
document.getElementById('download-pdf').addEventListener('click', async function() {
  const btn = this;
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ 正在生成精美简历...';
  btn.disabled = true;

  try {
    // 强制确保 html2pdf 已加载（双 CDN 保险）
    if (typeof html2pdf === 'undefined') {
      await new Promise(resolve => {
        const script = document.createElement('script');
        script.src = 'https://cdn.bootcdn.net/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }

    const resumeHTML = `
      <div style="font-family: 'Poppins', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: #fff; color: #222; line-height: 1.6;">
        <h1 style="text-align:center; color:#d97706; margin-bottom:10px;">KINGSLEY QI</h1>
        <p style="text-align:center; font-size:18px; color:#666;">自动化工程师 | 架构师 | IT工程师<br>Automation Engineer • Architect • IT Engineer</p>
        <hr style="border:2px solid #fbbf24; margin:25px 0;">
        
        <h2 style="color:#d97706; border-bottom:3px solid #fbbf24; padding-bottom:8px;">联系方式</h2>
        <p><strong>Email:</strong> i@kingsleyqi.com　|　<strong>Phone:</strong> +63 960864508*　|　<strong>生日:</strong> Aug 29, 1992　|　<strong>地点:</strong> Batangas, Philippines</p>
        
        <h2 style="color:#d97706; border-bottom:3px solid #fbbf24; padding-bottom:8px; margin-top:30px;">核心能力 & 服务</h2>
        <div style="columns:2; column-gap:30px;">${document.querySelector('.about-text').innerHTML}</div>
        
        <h2 style="color:#d97706; border-bottom:3px solid #fbbf24; padding-bottom:8px; margin-top:30px;">人生轨迹 & 专业技能</h2>
        ${document.querySelectorAll('.timeline, .skill').length > 0 ? 
          Array.from(document.querySelectorAll('.timeline, .skill')).map(el => el.outerHTML).join('') : ''}
        
        <h2 style="color:#d97706; border-bottom:3px solid #fbbf24; padding-bottom:8px; margin-top:30px;">代表项目</h2>
        <div style="font-size:15px;">${document.querySelector('.blog-posts-list').innerHTML}</div>
        
        <p style="text-align:center; margin-top:40px; color:#888; font-size:14px;">Generated by Kingsley Qi Portfolio • 2026</p>
      </div>
    `;

    const opt = {
      margin: [15, 15, 15, 15],
      filename: 'Kingsley_Qi_完整简历_2026.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(resumeHTML).save();

    btn.innerHTML = '✅ 已生成并下载！';
    setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 3000);

  } catch (e) {
    console.error(e);
    btn.innerHTML = '❌ 生成失败（请刷新后重试）';
    setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 4000);
  }
});