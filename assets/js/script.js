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
  const original = btn.innerHTML;
  btn.innerHTML = '⏳ 生成中...'; btn.disabled = true;

  try {
    // 确保库加载（如果 CDN 问题，可换本地文件）
    if (typeof html2pdf === 'undefined') {
      console.warn('html2pdf 未加载，尝试备用');
      // 可选：这里加备用 script 动态加载
    }

    const element = document.querySelector('article.active') || document.querySelector('.main-content');
    if (!element) throw new Error('未找到内容元素');

    const opt = {
      margin: 15,
      filename: 'Kingsley_Qi_完整档案.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.5, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(element).save();
    btn.innerHTML = '✅ 下载完成';
    setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 3000);
  } catch (err) {
    console.error('PDF 失败:', err);
    btn.innerHTML = '❌ 失败，重试';
    btn.disabled = false;
    alert('PDF 生成出错：' + err.message + '\n请 F12 Console 看错误，或换 Chrome/Edge 重试');
  }
});