/**
 * 模块市场后端服务
 * 
 * 功能：
 * 1. 扫描 modules 目录下的所有模块
 * 2. 读取每个模块的 module.json 配置
 * 3. 提供模块查询、搜索和管理 API
 * 4. 向 API 网关提供路由配置
 * 5. 向主应用提供子应用注册信息
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 模块目录路径
const MODULES_DIR = path.resolve(__dirname, '../../');

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/**
 * 扫描并加载所有模块
 */
function scanModules() {
  console.log(`📁 扫描模块目录: ${MODULES_DIR}`);
  const modules = [];

  try {
    // 读取模块目录
    const entries = fs.readdirSync(MODULES_DIR, { withFileTypes: true });

    // 遍历每个目录
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('module-')) {
        const modulePath = path.join(MODULES_DIR, entry.name);
        const moduleJsonPath = path.join(modulePath, 'module.json');

        // 检查是否存在 module.json
        if (fs.existsSync(moduleJsonPath)) {
          try {
            const moduleData = fs.readFileSync(moduleJsonPath, 'utf-8');
            const module = JSON.parse(moduleData);
            
            // 添加模块路径信息
            module.path = modulePath;
            module.hasBackend = fs.existsSync(path.join(modulePath, 'backend'));
            module.hasFrontend = fs.existsSync(path.join(modulePath, 'frontend'));

            modules.push(module);
            console.log(`  ✅ 加载模块: ${module.name} (${module.displayName})`);
          } catch (error) {
            console.error(`  ❌ 解析模块配置失败 [${entry.name}]:`, error.message);
          }
        } else {
          console.log(`  ⚠️ 跳过目录 [${entry.name}]: 没有 module.json`);
        }
      }
    }

    console.log(`📦 共加载 ${modules.length} 个模块`);
  } catch (error) {
    console.error('❌ 扫描模块目录失败:', error);
  }

  return modules;
}

// 全局模块列表（在内存中缓存）
let cachedModules = scanModules();

/**
 * API: 获取所有模块
 * GET /api/modules
 */
app.get('/api/modules', (req, res) => {
  const { type, enabled, search } = req.query;

  let modules = [...cachedModules];

  // 按类型过滤
  if (type) {
    modules = modules.filter(m => m.type === type);
  }

  // 按启用状态过滤
  if (enabled !== undefined) {
    const isEnabled = enabled === 'true';
    modules = modules.filter(m => m.enabled === isEnabled);
  }

  // 搜索过滤
  if (search) {
    const searchLower = search.toLowerCase();
    modules = modules.filter(m =>
      m.name.toLowerCase().includes(searchLower) ||
      m.displayName.toLowerCase().includes(searchLower) ||
      (m.description && m.description.toLowerCase().includes(searchLower))
    );
  }

  res.json(modules);
});

/**
 * API: 获取单个模块详情
 * GET /api/modules/:name
 */
app.get('/api/modules/:name', (req, res) => {
  const { name } = req.params;
  const module = cachedModules.find(m => m.name === name);

  if (!module) {
    return res.status(404).json({
      error: 'Not Found',
      message: `模块 ${name} 不存在`
    });
  }

  res.json(module);
});

/**
 * API: 获取模块统计信息
 * GET /api/modules/stats
 */
app.get('/api/stats', (req, res) => {
  const stats = {
    total: cachedModules.length,
    enabled: cachedModules.filter(m => m.enabled).length,
    disabled: cachedModules.filter(m => !m.enabled).length,
    withBackend: cachedModules.filter(m => m.hasBackend).length,
    withFrontend: cachedModules.filter(m => m.hasFrontend).length,
    byType: {}
  };

  // 按类型统计
  cachedModules.forEach(m => {
    const type = m.type || 'unknown';
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  });

  res.json(stats);
});

/**
 * API: 刷新模块列表
 * POST /api/refresh
 */
app.post('/api/refresh', (req, res) => {
  console.log('🔄 刷新模块列表...');
  cachedModules = scanModules();
  res.json({
    success: true,
    message: '模块列表已刷新',
    count: cachedModules.length
  });
});

/**
 * API: 健康检查
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'module-market',
    timestamp: new Date().toISOString(),
    modulesCount: cachedModules.length
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
  console.log('🚀 模块市场服务启动成功!');
  console.log(`   访问地址: http://localhost:${PORT}`);
  console.log(`   API 端点: http://localhost:${PORT}/api/modules`);
  console.log(`   健康检查: http://localhost:${PORT}/health`);
});
