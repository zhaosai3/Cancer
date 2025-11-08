/**
 * 模块市场前端 - Qiankun 子应用
 * 
 * 功能：
 * 1. 展示所有可用模块
 * 2. 提供模块搜索和过滤
 * 3. 显示模块详细信息
 * 4. 作为 qiankun 子应用运行
 */

import { createApp } from 'vue';
import axios from 'axios';

// 子应用的根组件
const App = {
  data() {
    return {
      modules: [],
      loading: true,
      error: null,
      searchQuery: '',
      filterType: 'all',
      stats: null
    };
  },
  computed: {
    filteredModules() {
      let filtered = this.modules;

      // 类型过滤
      if (this.filterType !== 'all') {
        filtered = filtered.filter(m => m.type === this.filterType);
      }

      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(m =>
          m.name.toLowerCase().includes(query) ||
          m.displayName.toLowerCase().includes(query) ||
          (m.description && m.description.toLowerCase().includes(query))
        );
      }

      return filtered;
    }
  },
  methods: {
    async fetchModules() {
      this.loading = true;
      this.error = null;
      try {
        const apiUrl = this.$apiGateway || 'http://localhost:3000';
        const response = await axios.get(`${apiUrl}/api/module-market/modules`);
        this.modules = response.data;
        console.log('✅ 获取模块列表成功:', this.modules.length);
      } catch (error) {
        console.error('❌ 获取模块列表失败:', error);
        this.error = '无法加载模块列表，请稍后重试';
      } finally {
        this.loading = false;
      }
    },
    async fetchStats() {
      try {
        const apiUrl = this.$apiGateway || 'http://localhost:3000';
        const response = await axios.get(`${apiUrl}/api/module-market/stats`);
        this.stats = response.data;
        console.log('✅ 获取统计信息成功');
      } catch (error) {
        console.error('❌ 获取统计信息失败:', error);
      }
    },
    async refreshModules() {
      try {
        const apiUrl = this.$apiGateway || 'http://localhost:3000';
        await axios.post(`${apiUrl}/api/module-market/refresh`);
        await this.fetchModules();
        await this.fetchStats();
        console.log('✅ 刷新模块列表成功');
      } catch (error) {
        console.error('❌ 刷新模块列表失败:', error);
      }
    },
    getModuleIcon(module) {
      return module.icon || '📦';
    },
    getModuleTypeLabel(type) {
      const labels = {
        core: '核心',
        business: '业务',
        tool: '工具',
        unknown: '未知'
      };
      return labels[type] || type;
    }
  },
  mounted() {
    console.log('🛒 模块市场子应用已挂载');
    this.fetchModules();
    this.fetchStats();
  },
  template: `
    <div class="module-market">
      <div class="market-header">
        <h1>🛒 模块市场</h1>
        <p class="subtitle">浏览和管理所有可用的业务能力模块</p>
      </div>

      <!-- 统计信息 -->
      <div v-if="stats" class="stats-bar">
        <div class="stat-item">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">总模块数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.enabled }}</span>
          <span class="stat-label">已启用</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.withBackend }}</span>
          <span class="stat-label">含后端</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.withFrontend }}</span>
          <span class="stat-label">含前端</span>
        </div>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索模块..."
          class="search-input"
        />
        <select v-model="filterType" class="filter-select">
          <option value="all">所有类型</option>
          <option value="core">核心模块</option>
          <option value="business">业务模块</option>
          <option value="tool">工具模块</option>
        </select>
        <button @click="refreshModules" class="refresh-btn">
          🔄 刷新
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <p>正在加载模块列表...</p>
      </div>

      <!-- 错误信息 -->
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="fetchModules" class="retry-btn">重试</button>
      </div>

      <!-- 模块列表 -->
      <div v-else class="modules-grid">
        <div
          v-for="module in filteredModules"
          :key="module.name"
          class="module-card"
        >
          <div class="module-header">
            <span class="module-icon">{{ getModuleIcon(module) }}</span>
            <div class="module-info">
              <h3 class="module-name">{{ module.displayName }}</h3>
              <span class="module-version">v{{ module.version }}</span>
            </div>
          </div>
          
          <p class="module-description">{{ module.description }}</p>
          
          <div class="module-tags">
            <span class="tag type-tag">{{ getModuleTypeLabel(module.type) }}</span>
            <span v-if="module.hasBackend" class="tag">后端</span>
            <span v-if="module.hasFrontend" class="tag">前端</span>
            <span v-if="module.enabled" class="tag enabled-tag">已启用</span>
            <span v-else class="tag disabled-tag">已禁用</span>
          </div>

          <div class="module-footer">
            <span class="module-id">{{ module.name }}</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && !error && filteredModules.length === 0" class="empty-state">
        <p>没有找到匹配的模块</p>
      </div>
    </div>
  `
};

// 应用样式
const styles = `
  .module-market {
    padding: 40px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .market-header {
    text-align: center;
    margin-bottom: 40px;
  }

  .market-header h1 {
    font-size: 36px;
    color: #333;
    margin-bottom: 10px;
  }

  .subtitle {
    font-size: 16px;
    color: #666;
  }

  .stats-bar {
    display: flex;
    gap: 20px;
    justify-content: center;
    margin-bottom: 30px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .stat-value {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 5px;
  }

  .stat-label {
    font-size: 14px;
    opacity: 0.9;
  }

  .toolbar {
    display: flex;
    gap: 15px;
    margin-bottom: 30px;
  }

  .search-input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
  }

  .filter-select {
    padding: 12px 16px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    min-width: 150px;
  }

  .refresh-btn {
    padding: 12px 24px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.3s;
  }

  .refresh-btn:hover {
    background: #5568d3;
  }

  .loading, .error, .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #999;
  }

  .error {
    color: #e74c3c;
  }

  .retry-btn {
    margin-top: 20px;
    padding: 10px 20px;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }

  .module-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.3s, box-shadow 0.3s;
    display: flex;
    flex-direction: column;
  }

  .module-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  }

  .module-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .module-icon {
    font-size: 36px;
  }

  .module-info {
    flex: 1;
  }

  .module-name {
    font-size: 18px;
    color: #333;
    margin: 0 0 4px 0;
  }

  .module-version {
    font-size: 12px;
    color: #999;
  }

  .module-description {
    color: #666;
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 16px;
    flex: 1;
  }

  .module-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .tag {
    padding: 4px 12px;
    background: #f0f0f0;
    color: #666;
    border-radius: 12px;
    font-size: 12px;
  }

  .type-tag {
    background: #e3f2fd;
    color: #1976d2;
  }

  .enabled-tag {
    background: #e8f5e9;
    color: #388e3c;
  }

  .disabled-tag {
    background: #ffebee;
    color: #d32f2f;
  }

  .module-footer {
    padding-top: 16px;
    border-top: 1px solid #eee;
  }

  .module-id {
    font-size: 12px;
    color: #999;
    font-family: monospace;
  }
`;

let app = null;
let container = null;

/**
 * Qiankun 生命周期：启动
 */
export async function bootstrap() {
  console.log('🛒 [module-market] bootstrap');
}

/**
 * Qiankun 生命周期：挂载
 */
export async function mount(props) {
  console.log('🛒 [module-market] mount', props);
  
  // 创建容器
  container = props.container ? props.container.querySelector('#subapp-container') : document.getElementById('subapp-container');
  if (!container) {
    container = document.body;
  }

  // 添加样式
  const style = document.createElement('style');
  style.innerHTML = styles;
  document.head.appendChild(style);

  // 创建 Vue 应用
  app = createApp(App);
  
  // 传递 props
  app.config.globalProperties.$apiGateway = props.apiGateway;
  app.config.globalProperties.$moduleName = props.moduleName;

  // 挂载应用
  const wrapper = document.createElement('div');
  wrapper.id = 'module-market-app';
  container.appendChild(wrapper);
  app.mount(wrapper);
}

/**
 * Qiankun 生命周期：卸载
 */
export async function unmount() {
  console.log('🛒 [module-market] unmount');
  if (app) {
    app.unmount();
    app = null;
  }
  if (container) {
    const wrapper = container.querySelector('#module-market-app');
    if (wrapper) {
      container.removeChild(wrapper);
    }
  }
}

/**
 * 独立运行（非 qiankun 环境）
 */
if (!window.__POWERED_BY_QIANKUN__) {
  mount({
    container: document.body,
    apiGateway: 'http://localhost:3000'
  });
}
