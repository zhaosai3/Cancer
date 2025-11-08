/**
 * Cancer 主应用入口文件
 * 
 * 功能：
 * 1. 初始化 qiankun 微前端框架
 * 2. 从模块市场获取所有可用的子应用配置
 * 3. 注册并启动子应用
 * 4. 处理路由和导航
 */

import { registerMicroApps, start, setDefaultMountApp } from 'qiankun';
import axios from 'axios';

// API 网关地址配置
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';
const MODULE_MARKET_API = `${API_GATEWAY_URL}/api/module-market`;

/**
 * 从模块市场获取所有可用模块的配置
 */
async function fetchModules() {
  try {
    console.log('🔍 正在从模块市场获取模块列表...');
    const response = await axios.get(`${MODULE_MARKET_API}/modules`);
    console.log('✅ 成功获取模块列表:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 获取模块列表失败:', error.message);
    // 返回默认模块配置作为降级方案
    return getDefaultModules();
  }
}

/**
 * 获取默认的模块配置（降级方案）
 * 当模块市场服务不可用时使用
 */
function getDefaultModules() {
  console.log('⚠️ 使用默认模块配置');
  return [
    {
      name: 'module-market',
      displayName: '模块市场',
      entry: 'http://localhost:8081',
      container: '#subapp-container',
      activeRule: '/module-market',
      frontend: {
        entry: 'http://localhost:8081',
        activeRule: '/module-market'
      }
    },
    {
      name: 'module-user',
      displayName: '用户管理',
      entry: 'http://localhost:8082',
      container: '#subapp-container',
      activeRule: '/user',
      frontend: {
        entry: 'http://localhost:8082',
        activeRule: '/user'
      }
    }
  ];
}

/**
 * 将模块配置转换为 qiankun 需要的格式
 */
function transformModulesToApps(modules) {
  return modules
    .filter(module => module.frontend) // 只注册有前端的模块
    .map(module => ({
      name: module.name,
      entry: module.frontend.entry || module.entry,
      container: module.frontend.container || '#subapp-container',
      activeRule: module.frontend.activeRule || module.activeRule,
      props: {
        apiGateway: API_GATEWAY_URL,
        moduleName: module.name,
        displayName: module.displayName
      }
    }));
}

/**
 * 初始化导航功能
 */
function initNavigation() {
  const navHome = document.getElementById('nav-home');
  const navMarket = document.getElementById('nav-market');
  const navUser = document.getElementById('nav-user');
  const welcomePage = document.getElementById('welcome-page');

  // 更新导航激活状态
  function updateActiveNav() {
    const path = window.location.pathname;
    
    // 移除所有激活状态
    [navHome, navMarket, navUser].forEach(nav => {
      if (nav) nav.classList.remove('active');
    });

    // 设置当前路径的激活状态
    if (path === '/' || path === '') {
      navHome && navHome.classList.add('active');
      welcomePage && (welcomePage.style.display = 'block');
    } else if (path.startsWith('/module-market')) {
      navMarket && navMarket.classList.add('active');
      welcomePage && (welcomePage.style.display = 'none');
    } else if (path.startsWith('/user')) {
      navUser && navUser.classList.add('active');
      welcomePage && (welcomePage.style.display = 'none');
    } else {
      welcomePage && (welcomePage.style.display = 'none');
    }
  }

  // 导航点击事件处理
  function handleNavClick(e) {
    e.preventDefault();
    const href = e.target.getAttribute('href');
    window.history.pushState({}, '', href);
    updateActiveNav();
  }

  // 绑定导航点击事件
  if (navHome) navHome.addEventListener('click', handleNavClick);
  if (navMarket) navMarket.addEventListener('click', handleNavClick);
  if (navUser) navUser.addEventListener('click', handleNavClick);

  // 监听浏览器前进后退
  window.addEventListener('popstate', updateActiveNav);

  // 初始化时更新导航状态
  updateActiveNav();
}

/**
 * 主应用初始化函数
 */
async function initMainApp() {
  console.log('🎯 Cancer 主应用正在启动...');

  try {
    // 1. 获取模块配置
    const modules = await fetchModules();
    
    // 2. 转换为 qiankun 应用配置
    const apps = transformModulesToApps(modules);
    console.log('📦 准备注册的子应用:', apps);

    // 3. 注册微应用
    registerMicroApps(apps, {
      // 子应用加载前
      beforeLoad: app => {
        console.log(`⏳ 正在加载子应用: ${app.name}`);
        return Promise.resolve();
      },
      // 子应用挂载后
      afterMount: app => {
        console.log(`✅ 子应用已挂载: ${app.name}`);
        return Promise.resolve();
      },
      // 子应用卸载后
      afterUnmount: app => {
        console.log(`👋 子应用已卸载: ${app.name}`);
        return Promise.resolve();
      }
    });

    // 4. 启动 qiankun
    start({
      prefetch: true, // 预加载
      sandbox: {
        strictStyleIsolation: false, // 样式隔离
        experimentalStyleIsolation: true
      },
      singular: true // 单实例模式
    });

    // 5. 初始化导航
    initNavigation();

    console.log('🚀 Cancer 主应用启动成功！');
  } catch (error) {
    console.error('❌ 主应用启动失败:', error);
  }
}

// 页面加载完成后初始化主应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMainApp);
} else {
  initMainApp();
}
