/**
 * 用户管理模块后端服务
 * 
 * 功能：
 * 1. 提供用户的 CRUD API
 * 2. 模拟用户数据存储（内存）
 * 3. 支持用户搜索和分页
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3002;

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 模拟用户数据（内存存储）
let users = [
  {
    id: uuidv4(),
    username: 'admin',
    name: '管理员',
    email: 'admin@cancer.com',
    role: 'admin',
    status: 'active',
    createdAt: new Date('2024-01-01').toISOString()
  },
  {
    id: uuidv4(),
    username: 'user1',
    name: '张三',
    email: 'zhangsan@cancer.com',
    role: 'user',
    status: 'active',
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    id: uuidv4(),
    username: 'user2',
    name: '李四',
    email: 'lisi@cancer.com',
    role: 'user',
    status: 'active',
    createdAt: new Date('2024-02-01').toISOString()
  },
  {
    id: uuidv4(),
    username: 'user3',
    name: '王五',
    email: 'wangwu@cancer.com',
    role: 'user',
    status: 'inactive',
    createdAt: new Date('2024-02-15').toISOString()
  }
];

/**
 * API: 获取用户列表
 * GET /api/users
 */
app.get('/api/users', (req, res) => {
  const { page = 1, pageSize = 10, search, role, status } = req.query;
  
  let filteredUsers = [...users];

  // 搜索过滤
  if (search) {
    const searchLower = search.toLowerCase();
    filteredUsers = filteredUsers.filter(user =>
      user.username.toLowerCase().includes(searchLower) ||
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  }

  // 角色过滤
  if (role) {
    filteredUsers = filteredUsers.filter(user => user.role === role);
  }

  // 状态过滤
  if (status) {
    filteredUsers = filteredUsers.filter(user => user.status === status);
  }

  // 分页
  const total = filteredUsers.length;
  const start = (page - 1) * pageSize;
  const end = start + parseInt(pageSize);
  const paginatedUsers = filteredUsers.slice(start, end);

  res.json({
    data: paginatedUsers,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total: total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
});

/**
 * API: 获取单个用户
 * GET /api/users/:id
 */
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({
      error: 'Not Found',
      message: `用户 ${id} 不存在`
    });
  }

  res.json(user);
});

/**
 * API: 创建用户
 * POST /api/users
 */
app.post('/api/users', (req, res) => {
  const { username, name, email, role = 'user', status = 'active' } = req.body;

  // 验证必填字段
  if (!username || !name || !email) {
    return res.status(400).json({
      error: 'Bad Request',
      message: '用户名、姓名和邮箱为必填项'
    });
  }

  // 检查用户名是否已存在
  if (users.find(u => u.username === username)) {
    return res.status(409).json({
      error: 'Conflict',
      message: '用户名已存在'
    });
  }

  // 创建新用户
  const newUser = {
    id: uuidv4(),
    username,
    name,
    email,
    role,
    status,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  console.log(`✅ 创建用户成功: ${username}`);

  res.status(201).json(newUser);
});

/**
 * API: 更新用户
 * PUT /api/users/:id
 */
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, name, email, role, status } = req.body;

  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({
      error: 'Not Found',
      message: `用户 ${id} 不存在`
    });
  }

  // 如果修改用户名，检查是否与其他用户冲突
  if (username && username !== users[userIndex].username) {
    if (users.find(u => u.username === username && u.id !== id)) {
      return res.status(409).json({
        error: 'Conflict',
        message: '用户名已存在'
      });
    }
  }

  // 更新用户信息
  users[userIndex] = {
    ...users[userIndex],
    ...(username && { username }),
    ...(name && { name }),
    ...(email && { email }),
    ...(role && { role }),
    ...(status && { status }),
    updatedAt: new Date().toISOString()
  };

  console.log(`✅ 更新用户成功: ${id}`);
  res.json(users[userIndex]);
});

/**
 * API: 删除用户
 * DELETE /api/users/:id
 */
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const userIndex = users.findIndex(u => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({
      error: 'Not Found',
      message: `用户 ${id} 不存在`
    });
  }

  const deletedUser = users[userIndex];
  users.splice(userIndex, 1);
  console.log(`✅ 删除用户成功: ${id}`);

  res.json({
    success: true,
    message: '用户已删除',
    user: deletedUser
  });
});

/**
 * API: 获取用户统计
 * GET /api/stats
 */
app.get('/api/stats', (req, res) => {
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    byRole: {
      admin: users.filter(u => u.role === 'admin').length,
      user: users.filter(u => u.role === 'user').length
    }
  };

  res.json(stats);
});

/**
 * API: 健康检查
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'module-user',
    timestamp: new Date().toISOString(),
    usersCount: users.length
  });
});

/**
 * 404 处理
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `路由 ${req.url} 不存在`
  });
});

/**
 * 错误处理中间件
 */
app.use((err, req, res, next) => {
  console.error('❌ 服务器错误:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

/**
 * 启动服务
 */
app.listen(PORT, () => {
  console.log('🚀 用户管理服务启动成功!');
  console.log(`   访问地址: http://localhost:${PORT}`);
  console.log(`   API 端点: http://localhost:${PORT}/api/users`);
  console.log(`   健康检查: http://localhost:${PORT}/health`);
  console.log(`   初始用户数: ${users.length}`);
});
