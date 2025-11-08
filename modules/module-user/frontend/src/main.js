/**
 * 用户管理前端 - Qiankun 子应用
 * 
 * 功能：
 * 1. 显示用户列表
 * 2. 支持用户搜索和过滤
 * 3. 提供用户增删改查操作
 * 4. 作为 qiankun 子应用运行
 */

import { createApp } from 'vue';
import axios from 'axios';

// 子应用的根组件
const App = {
  data() {
    return {
      users: [],
      loading: true,
      error: null,
      searchQuery: '',
      filterRole: 'all',
      filterStatus: 'all',
      stats: null,
      showAddForm: false,
      editingUser: null,
      formData: {
        username: '',
        name: '',
        email: '',
        role: 'user',
        status: 'active'
      }
    };
  },
  computed: {
    filteredUsers() {
      let filtered = this.users;

      // 角色过滤
      if (this.filterRole !== 'all') {
        filtered = filtered.filter(u => u.role === this.filterRole);
      }

      // 状态过滤
      if (this.filterStatus !== 'all') {
        filtered = filtered.filter(u => u.status === this.filterStatus);
      }

      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(u =>
          u.username.toLowerCase().includes(query) ||
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
        );
      }

      return filtered;
    }
  },
  methods: {
    async fetchUsers() {
      this.loading = true;
      this.error = null;
      try {
        const apiUrl = this.$apiGateway || 'http://localhost:3000';
        const response = await axios.get(`${apiUrl}/api/user/api/users`);
        this.users = response.data.data || response.data;
        console.log('✅ 获取用户列表成功:', this.users.length);
      } catch (error) {
        console.error('❌ 获取用户列表失败:', error);
        this.error = '无法加载用户列表，请稍后重试';
      } finally {
        this.loading = false;
      }
    },
    async fetchStats() {
      try {
        const apiUrl = this.$apiGateway || 'http://localhost:3000';
        const response = await axios.get(`${apiUrl}/api/user/api/stats`);
        this.stats = response.data;
        console.log('✅ 获取统计信息成功');
      } catch (error) {
        console.error('❌ 获取统计信息失败:', error);
      }
    },
    async deleteUser(userId) {
      if (!confirm('确定要删除这个用户吗？')) {
        return;
      }

      try {
        const apiUrl = this.$apiGateway || 'http://localhost:3000';
        await axios.delete(`${apiUrl}/api/user/api/users/${userId}`);
        console.log('✅ 删除用户成功');
        await this.fetchUsers();
        await this.fetchStats();
      } catch (error) {
        console.error('❌ 删除用户失败:', error);
        alert('删除用户失败：' + error.message);
      }
    },
    showAddUserForm() {
      this.showAddForm = true;
      this.editingUser = null;
      this.formData = {
        username: '',
        name: '',
        email: '',
        role: 'user',
        status: 'active'
      };
    },
    showEditUserForm(user) {
      this.showAddForm = true;
      this.editingUser = user;
      this.formData = {
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      };
    },
    hideForm() {
      this.showAddForm = false;
      this.editingUser = null;
    },
    async submitForm() {
      try {
        const apiUrl = this.$apiGateway || 'http://localhost:3000';
        
        if (this.editingUser) {
          // 更新用户
          await axios.put(`${apiUrl}/api/user/api/users/${this.editingUser.id}`, this.formData);
          console.log('✅ 更新用户成功');
        } else {
          // 创建用户
          await axios.post(`${apiUrl}/api/user/api/users`, this.formData);
          console.log('✅ 创建用户成功');
        }

        this.hideForm();
        await this.fetchUsers();
        await this.fetchStats();
      } catch (error) {
        console.error('❌ 操作失败:', error);
        alert('操作失败：' + (error.response?.data?.message || error.message));
      }
    },
    getRoleName(role) {
      const roles = {
        admin: '管理员',
        user: '普通用户'
      };
      return roles[role] || role;
    },
    getStatusName(status) {
      const statuses = {
        active: '活跃',
        inactive: '未激活'
      };
      return statuses[status] || status;
    },
    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    }
  },
  mounted() {
    console.log('👥 用户管理子应用已挂载');
    this.fetchUsers();
    this.fetchStats();
  },
  template: `
    <div class="user-module">
      <div class="module-header">
        <h1>👥 用户管理</h1>
        <p class="subtitle">管理系统用户和权限</p>
      </div>

      <!-- 统计信息 -->
      <div v-if="stats" class="stats-bar">
        <div class="stat-item">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">总用户数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.active }}</span>
          <span class="stat-label">活跃用户</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.byRole?.admin || 0 }}</span>
          <span class="stat-label">管理员</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.byRole?.user || 0 }}</span>
          <span class="stat-label">普通用户</span>
        </div>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索用户..."
          class="search-input"
        />
        <select v-model="filterRole" class="filter-select">
          <option value="all">所有角色</option>
          <option value="admin">管理员</option>
          <option value="user">普通用户</option>
        </select>
        <select v-model="filterStatus" class="filter-select">
          <option value="all">所有状态</option>
          <option value="active">活跃</option>
          <option value="inactive">未激活</option>
        </select>
        <button @click="showAddUserForm" class="add-btn">
          ➕ 添加用户
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <p>正在加载用户列表...</p>
      </div>

      <!-- 错误信息 -->
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="fetchUsers" class="retry-btn">重试</button>
      </div>

      <!-- 用户表格 -->
      <div v-else class="table-container">
        <table class="user-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>姓名</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>{{ user.username }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="badge" :class="'badge-' + user.role">
                  {{ getRoleName(user.role) }}
                </span>
              </td>
              <td>
                <span class="badge" :class="'badge-' + user.status">
                  {{ getStatusName(user.status) }}
                </span>
              </td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td class="actions">
                <button @click="showEditUserForm(user)" class="btn-edit">
                  编辑
                </button>
                <button @click="deleteUser(user.id)" class="btn-delete">
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 空状态 -->
        <div v-if="filteredUsers.length === 0" class="empty-state">
          <p>没有找到匹配的用户</p>
        </div>
      </div>

      <!-- 添加/编辑表单弹窗 -->
      <div v-if="showAddForm" class="modal-overlay" @click="hideForm">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h2>{{ editingUser ? '编辑用户' : '添加用户' }}</h2>
            <button @click="hideForm" class="close-btn">×</button>
          </div>
          <form @submit.prevent="submitForm" class="user-form">
            <div class="form-group">
              <label>用户名 *</label>
              <input v-model="formData.username" type="text" required />
            </div>
            <div class="form-group">
              <label>姓名 *</label>
              <input v-model="formData.name" type="text" required />
            </div>
            <div class="form-group">
              <label>邮箱 *</label>
              <input v-model="formData.email" type="email" required />
            </div>
            <div class="form-group">
              <label>角色</label>
              <select v-model="formData.role">
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model="formData.status">
                <option value="active">活跃</option>
                <option value="inactive">未激活</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" @click="hideForm" class="btn-cancel">
                取消
              </button>
              <button type="submit" class="btn-submit">
                {{ editingUser ? '更新' : '创建' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
};

// 应用样式
const styles = `
  .user-module {
    padding: 40px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .module-header {
    text-align: center;
    margin-bottom: 40px;
  }

  .module-header h1 {
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

  .add-btn {
    padding: 12px 24px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.3s;
  }

  .add-btn:hover {
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

  .table-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  .user-table {
    width: 100%;
    border-collapse: collapse;
  }

  .user-table th,
  .user-table td {
    padding: 16px;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
  }

  .user-table th {
    background: #f8f9fa;
    font-weight: 600;
    color: #333;
  }

  .user-table tbody tr:hover {
    background: #f8f9fa;
  }

  .badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    display: inline-block;
  }

  .badge-admin {
    background: #e3f2fd;
    color: #1976d2;
  }

  .badge-user {
    background: #f3e5f5;
    color: #7b1fa2;
  }

  .badge-active {
    background: #e8f5e9;
    color: #388e3c;
  }

  .badge-inactive {
    background: #ffebee;
    color: #d32f2f;
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .btn-edit,
  .btn-delete {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: opacity 0.3s;
  }

  .btn-edit {
    background: #2196f3;
    color: white;
  }

  .btn-delete {
    background: #f44336;
    color: white;
  }

  .btn-edit:hover,
  .btn-delete:hover {
    opacity: 0.8;
  }

  /* 模态框样式 */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 8px;
    padding: 30px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 24px;
    color: #333;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 32px;
    color: #999;
    cursor: pointer;
    line-height: 1;
  }

  .close-btn:hover {
    color: #333;
  }

  .user-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    font-weight: 600;
    color: #333;
    font-size: 14px;
  }

  .form-group input,
  .form-group select {
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #667eea;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 10px;
  }

  .btn-cancel,
  .btn-submit {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: opacity 0.3s;
  }

  .btn-cancel {
    background: #e0e0e0;
    color: #333;
  }

  .btn-submit {
    background: #667eea;
    color: white;
  }

  .btn-cancel:hover,
  .btn-submit:hover {
    opacity: 0.8;
  }
`;

let app = null;
let container = null;

/**
 * Qiankun 生命周期：启动
 */
export async function bootstrap() {
  console.log('👥 [module-user] bootstrap');
}

/**
 * Qiankun 生命周期：挂载
 */
export async function mount(props) {
  console.log('👥 [module-user] mount', props);
  
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
  wrapper.id = 'module-user-app';
  container.appendChild(wrapper);
  app.mount(wrapper);
}

/**
 * Qiankun 生命周期：卸载
 */
export async function unmount() {
  console.log('👥 [module-user] unmount');
  if (app) {
    app.unmount();
    app = null;
  }
  if (container) {
    const wrapper = container.querySelector('#module-user-app');
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
