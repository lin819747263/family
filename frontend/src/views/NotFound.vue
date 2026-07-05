<template>
  <div class="not-found">
    <div class="nf-code">404</div>
    <div class="nf-text">页面不存在</div>
    <p class="nf-desc">您访问的页面可能已被移除或地址错误</p>
    <el-button type="primary" @click="$router.push('/')">
      <el-icon><House /></el-icon>返回首页
    </el-button>
  </div>
</template>

<style scoped>
.not-found {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 80vh; text-align: center; padding: 40px;
}
.nf-code {
  font-size: 120px; font-weight: 900; line-height: 1;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.nf-text { font-size: 24px; font-weight: 700; color: #1e293b; margin-top: 16px; }
.nf-desc { font-size: 14px; color: #94a3b8; margin: 12px 0 24px; }
</style>
