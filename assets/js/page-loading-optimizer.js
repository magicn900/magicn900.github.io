/**
 * 页面加载优化脚本
 * 解决博客加载时只显示背景和导航栏的问题
 */

(function() {
  'use strict';

  // 创建loading遮罩
  function createLoadingOverlay() {
    const loadingHTML = `
      <div class="page-loading" id="page-loading">
        <div class="loading-animation">
          <div class="loading-capsules">
            <div class="loading-capsule"></div>
            <div class="loading-capsule"></div>
            <div class="loading-capsule"></div>
          </div>
          <div class="loading-text">LOADING...</div>
        </div>
      </div>
    `;
    
    // 在页面开始就插入loading
    document.documentElement.insertAdjacentHTML('afterbegin', loadingHTML);
  }

  // 页面加载完成后的处理
  function handlePageLoaded() {
    // 为各个区域添加loaded类（不包括page-banner，保持原模板动画）
    const elementsToLoad = [
      '.site-header',
      '.main',
      '.page-content'
    ];

    elementsToLoad.forEach((selector, index) => {
      const element = document.querySelector(selector);
      if (element) {
        setTimeout(() => {
          element.classList.add('loaded');
        }, index * 100);
      }
    });

    // 为文章项目添加加载效果
    const postItems = document.querySelectorAll('.post-item');
    postItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('loaded');
      }, 200 + index * 100);
    });

    // 移除loading遮罩
    setTimeout(() => {
      const loadingOverlay = document.getElementById('page-loading');
      if (loadingOverlay) {
        loadingOverlay.classList.add('loaded');
        setTimeout(() => {
          loadingOverlay.remove(); // 完全移除DOM元素
        }, 500);
      }
    }, 300);
  }

  // 检查页面是否已经加载完成
  function checkPageReady() {
    const criticalElements = [
      '.site-header',
      '.main'
    ];

    const allElementsExist = criticalElements.every(selector => 
      document.querySelector(selector) !== null
    );

    if (allElementsExist && document.readyState === 'complete') {
      handlePageLoaded();
      return true;
    }
    return false;
  }

  // 初始化函数
  function init() {
    // 记录初始滚动位置，避免干扰原始的滚动行为
    const initialScrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    // 立即创建loading遮罩
    createLoadingOverlay();

    // 如果页面已经加载完成，直接处理
    if (checkPageReady()) {
      return;
    }

    // 监听DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          if (!checkPageReady()) {
            // 如果DOM加载完成后还没准备好，继续等待
            window.addEventListener('load', handlePageLoaded);
          }
        }, 100);
      });
    } else {
      // DOM已经加载完成
      setTimeout(() => {
        if (!checkPageReady()) {
          window.addEventListener('load', handlePageLoaded);
        }
      }, 100);
    }

    // 备用计时器，防止页面卡住
    setTimeout(() => {
      if (document.getElementById('page-loading')) {
        console.log('页面加载超时，强制移除loading');
        handlePageLoaded();
      }
    }, 8000);
  }

  // 优化图片加载
  function optimizeImageLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        });
      }
    });
  }

  // 在页面加载完成后优化图片
  window.addEventListener('load', optimizeImageLoading);

  // 启动初始化
  init();

  // 为旧版浏览器提供兼容性
  if (!window.addEventListener) {
    window.attachEvent('onload', handlePageLoaded);
  }

})();
