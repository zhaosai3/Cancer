/**
 * Cancer API 网关
 * 
 * 功能：
 * 1. 从模块市场动态获取路由规则
 * 2. 将前端请求代理到相应的后端微服务
 * 3. 处理跨域请求
 * 4. 提供统一的 API 入口
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// 模块市场服务地址
const MODULE_MARKET_URL = process.env.MODULE_MARKET_URL || 'http://localhost:3001';

// 中间件配置
app.use(cors()); // 启用 CORS
app.use(bodyParser.json()); // 解析 JSON 请求体
app.use(bodyParser.urlencoded({ extended: true })); // 解析 URL 编码的请求体

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/**
 * 从模块市场获取所有模块的配置
 */
async function fetchModulesFromMarket() {
  try {
    console.log(`📡 正在从模块市场获取配置: ${MODULE_MARKET_URL}/api/modules`);
    const response = await axios.get(`${MODULE_MARKET_URL}/api/modules`, {
      timeout: 5000
    });
    console.log(`✅ 成功获取 ${response.data.length} 个模块配置`);
    return response.data;
  } catch (error) {
    console.error('❌ 获取模块配置失败:', error.message);
    // 返回默认配置作为降级方案
    return getDefaultModules();
  }
}

/**
 * 默认模块配置（降级方案）
 */
function getDefaultModules() {
  console.log('⚠️ 使用默认模块配置');
  return [
    {
      name: 'module-market',
      backend: {
        url: 'http://localhost:3001',
        prefix: '/api/module-market'
      }
    },
    {
      name: 'module-user',
      backend: {
        url: 'http://localhost:3002',
        prefix: '/api/user'
      }
    }
  ];
}

/**
 * 设置动态路由
 */
async function setupDynamicRoutes() {
  try {
    // 获取模块配置
    const modules = await fetchModulesFromMarket();

    // 为每个模块设置代理路由
    modules.forEach(module => {
      if (module.backend && module.backend.url) {
        const prefix = module.backend.prefix || `/api/${module.name}`;
        const targetUrl = module.backend.url;

        console.log(`🔗 注册路由: ${prefix} -> ${targetUrl}`);

        // 创建代理中间件
        app.use(
          prefix,
          createProxyMiddleware({
            target: targetUrl,
            changeOrigin: true,
            pathRewrite: (path, req) => {
              // 移除 API 前缀，保留剩余路径
              const newPath = path.replace(prefix, '');
              console.log(`  ↪ 代理: ${path} -> ${targetUrl}${newPath}`);
              return newPath;
            },
            onError: (err, req, res) => {
              console.error(`❌ 代理错误 [${prefix}]:`, err.message);
              res.status(502).json({
                error: 'Bad Gateway',
                message: `无法连接到服务: ${module.name}`,
                details: err.message
              });
            },
            onProxyReq: (proxyReq, req, res) => {
              // 可以在这里添加请求头或进行请求转换
              proxyReq.setHeader('X-Gateway', 'Cancer-API-Gateway');
              proxyReq.setHeader('X-Module-Name', module.name);
            }
          })
        );
      }
    });

    console.log('✅ 动态路由配置完成');
  } catch (error) {
    console.error('❌ 设置动态路由失败:', error);
  }
}

/**
 * 健康检查端点
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway'
  });
});

/**
 * 获取网关状态
 */
app.get('/api/gateway/status', (req, res) => {
  res.json({
    status: 'running',
    version: '1.0.0',
    moduleMarketUrl: MODULE_MARKET_URL,
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 处理
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `路由 ${req.url} 不存在`,
    timestamp: new Date().toISOString()
  });
});

/**
 * 错误处理中间件
 */
app.use((err, req, res, next) => {
  console.error('❌ 服务器错误:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

/**
 * 启动 API 网关
 */
async function startGateway() {
  console.log('🚀 Cancer API 网关正在启动...');
  console.log(`   模块市场地址: ${MODULE_MARKET_URL}`);
  console.log(`   监听端口: ${PORT}`);

  // 设置动态路由
  await setupDynamicRoutes();

  // 启动服务器
  app.listen(PORT, () => {
    console.log('✅ API 网关启动成功!');
    console.log(`   访问地址: http://localhost:${PORT}`);
    console.log(`   健康检查: http://localhost:${PORT}/health`);
    console.log(`   网关状态: http://localhost:${PORT}/api/gateway/status`);
  });

  // 定期刷新路由配置（可选）
  setInterval(async () => {
    console.log('🔄 刷新路由配置...');
    // 这里可以实现路由的热更新
    // 由于 Express 的限制，实际项目中可能需要更复杂的实现
  }, 60000); // 每分钟刷新一次
}

// 启动网关
startGateway().catch(error => {
  console.error('❌ 启动失败:', error);
  process.exit(1);
});
