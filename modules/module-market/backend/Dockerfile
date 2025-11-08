# 模块市场后端 Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 创建 modules 目录挂载点
RUN mkdir -p /app/modules

# 暴露端口
EXPOSE 3001

# 启动应用
CMD ["npm", "start"]
