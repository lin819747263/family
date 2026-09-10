<template>
  <div class="not-found">
    <div class="nf-illustration">
      <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="80" r="60" fill="#f0f4ff" stroke="var(--terracotta)" stroke-width="2" stroke-dasharray="8 4"/>
        <text x="100" y="75" text-anchor="middle" font-size="48" font-weight="900" fill="url(#grad)">404</text>
        <text x="100" y="100" text-anchor="middle" font-size="12" fill="#94a3b8">页面走丢了</text>
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:var(--terracotta)"/>
            <stop offset="100%" style="stop-color:#D3A98B"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
    <h1 class="nf-title">页面不存在</h1>
    <p class="nf-desc">您访问的页面可能已被移除、更名，或者暂时不可用</p>
    <div class="nf-actions">
      <el-button type="primary" @click="$router.push('/')">
        <el-icon><House /></el-icon>返回首页
      </el-button>
      <el-button @click="$router.back()">
        <el-icon><Back /></el-icon>返回上页
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { House, Back } from '@element-plus/icons-vue'
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  text-align: center;
  padding: 40px;
}

.nf-illustration {
  width: 200px;
  height: 160px;
  margin-bottom: 24px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.nf-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px;
}

.nf-desc {
  font-size: 14px;
  color: #94a3b8;
  margin: 0 0 32px;
  max-width: 400px;
  line-height: 1.6;
}

.nf-actions {
  display: flex;
  gap: 12px;
}
</style>
