<template>
  <div class="login-page">
    <!-- 背景渐变 -->
    <div class="bg-gradient"></div>

    <!-- 浮动装饰元素 -->
    <div class="floating-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="shape shape-4"></div>
      <div class="shape shape-5"></div>
      <div class="shape shape-6"></div>
      <div class="shape shape-ring ring-1"></div>
      <div class="shape shape-ring ring-2"></div>
    </div>

    <!-- 主内容区 -->
    <div class="login-wrapper">
      <!-- 左侧插画区域 -->
      <div class="illustration-area">
        <div class="illust-card">
          <!-- 家庭 SVG 插画 -->
          <svg class="home-illustration" viewBox="0 0 480 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- 房子主体 -->
            <rect x="120" y="180" width="240" height="180" rx="8" fill="url(#houseGrad)" opacity="0.9"/>
            <!-- 屋顶 -->
            <path d="M80 190 L240 60 L400 190" stroke="url(#roofGrad)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M100 185 L240 70 L380 185" fill="url(#roofFill)" opacity="0.15"/>
            <!-- 门 -->
            <rect x="200" y="270" width="80" height="90" rx="6" fill="url(#doorGrad)" opacity="0.85"/>
            <circle cx="265" cy="318" r="4" fill="#fff" opacity="0.8"/>
            <!-- 窗户 -->
            <rect x="145" y="220" width="45" height="45" rx="4" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
            <line x1="167.5" y1="220" x2="167.5" y2="265" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
            <line x1="145" y1="242.5" x2="190" y2="242.5" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
            <rect x="290" y="220" width="45" height="45" rx="4" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
            <line x1="312.5" y1="220" x2="312.5" y2="265" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
            <line x1="290" y1="242.5" x2="335" y2="242.5" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
            <!-- 烟囱 -->
            <rect x="310" y="100" width="30" height="70" rx="4" fill="url(#chimneyGrad)" opacity="0.7"/>
            <!-- 烟 -->
            <circle class="smoke smoke-1" cx="325" cy="85" r="8" fill="rgba(255,255,255,0.3)"/>
            <circle class="smoke smoke-2" cx="332" cy="70" r="6" fill="rgba(255,255,255,0.2)"/>
            <circle class="smoke smoke-3" cx="328" cy="55" r="5" fill="rgba(255,255,255,0.15)"/>
            <!-- 树 -->
            <rect x="60" y="290" width="12" height="70" rx="4" fill="#a0845e" opacity="0.6"/>
            <circle cx="66" cy="270" r="30" fill="url(#treeGrad)" opacity="0.5"/>
            <circle cx="52" cy="280" r="22" fill="url(#treeGrad)" opacity="0.4"/>
            <circle cx="80" cy="278" r="20" fill="url(#treeGrad)" opacity="0.35"/>
            <!-- 小树 -->
            <rect x="400" y="310" width="8" height="50" rx="4" fill="#a0845e" opacity="0.5"/>
            <circle cx="404" cy="295" r="20" fill="url(#treeGrad)" opacity="0.4"/>
            <circle cx="394" cy="302" r="15" fill="url(#treeGrad)" opacity="0.3"/>
            <!-- 太阳 -->
            <circle class="sun" cx="80" cy="80" r="30" fill="url(#sunGrad)" opacity="0.6"/>
            <circle class="sun-glow" cx="80" cy="80" r="45" fill="url(#sunGlow)" opacity="0.2"/>
            <!-- 云 -->
            <g class="cloud cloud-1" opacity="0.4">
              <ellipse cx="180" cy="100" rx="35" ry="14" fill="#fff"/>
              <ellipse cx="200" cy="94" rx="25" ry="12" fill="#fff"/>
              <ellipse cx="165" cy="96" rx="20" ry="10" fill="#fff"/>
            </g>
            <g class="cloud cloud-2" opacity="0.3">
              <ellipse cx="360" cy="70" rx="28" ry="11" fill="#fff"/>
              <ellipse cx="378" cy="65" rx="20" ry="9" fill="#fff"/>
            </g>
            <!-- 草地 -->
            <ellipse cx="240" cy="365" rx="220" ry="20" fill="url(#grassGrad)" opacity="0.3"/>
            <!-- 花朵 -->
            <g class="flower flower-1">
              <circle cx="130" cy="350" r="5" fill="#ff9a9e" opacity="0.7"/>
              <circle cx="130" cy="343" r="3" fill="#ff9a9e" opacity="0.5"/>
              <circle cx="136" cy="347" r="3" fill="#ff9a9e" opacity="0.5"/>
              <circle cx="124" cy="347" r="3" fill="#ff9a9e" opacity="0.5"/>
              <line x1="130" y1="355" x2="130" y2="370" stroke="#7db87d" stroke-width="2" opacity="0.5"/>
            </g>
            <g class="flower flower-2">
              <circle cx="360" cy="345" r="4" fill="#a78bfa" opacity="0.6"/>
              <circle cx="360" cy="339" r="2.5" fill="#a78bfa" opacity="0.4"/>
              <circle cx="365" cy="342" r="2.5" fill="#a78bfa" opacity="0.4"/>
              <circle cx="355" cy="342" r="2.5" fill="#a78bfa" opacity="0.4"/>
              <line x1="360" y1="349" x2="360" y2="362" stroke="#7db87d" stroke-width="1.5" opacity="0.4"/>
            </g>
            <!-- 飞鸟 -->
            <g class="bird bird-1" opacity="0.4">
              <path d="M140 130 Q145 125 150 130" stroke="#666" stroke-width="1.5" fill="none"/>
              <path d="M150 130 Q155 125 160 130" stroke="#666" stroke-width="1.5" fill="none"/>
            </g>
            <g class="bird bird-2" opacity="0.3">
              <path d="M300 90 Q304 86 308 90" stroke="#666" stroke-width="1.2" fill="none"/>
              <path d="M308 90 Q312 86 316 90" stroke="#666" stroke-width="1.2" fill="none"/>
            </g>
            <!-- 爱心 -->
            <g class="heart-float">
              <path d="M240 40 C240 35, 248 30, 248 37 C248 42, 240 48, 240 48 C240 48, 232 42, 232 37 C232 30, 240 35, 240 40Z" fill="#ff6b8a" opacity="0.5"/>
            </g>
            <defs>
              <linearGradient id="houseGrad" x1="120" y1="180" x2="360" y2="360">
                <stop offset="0%" stop-color="#e8dff5"/>
                <stop offset="100%" stop-color="#d4c5f0"/>
              </linearGradient>
              <linearGradient id="roofGrad" x1="80" y1="190" x2="400" y2="190">
                <stop offset="0%" stop-color="#667eea"/>
                <stop offset="100%" stop-color="#764ba2"/>
              </linearGradient>
              <linearGradient id="roofFill" x1="100" y1="185" x2="380" y2="185">
                <stop offset="0%" stop-color="#667eea"/>
                <stop offset="100%" stop-color="#764ba2"/>
              </linearGradient>
              <linearGradient id="doorGrad" x1="200" y1="270" x2="280" y2="360">
                <stop offset="0%" stop-color="#667eea"/>
                <stop offset="100%" stop-color="#5a67d8"/>
              </linearGradient>
              <linearGradient id="chimneyGrad" x1="310" y1="100" x2="340" y2="170">
                <stop offset="0%" stop-color="#c4b5e0"/>
                <stop offset="100%" stop-color="#a78bca"/>
              </linearGradient>
              <radialGradient id="treeGrad">
                <stop offset="0%" stop-color="#86efac"/>
                <stop offset="100%" stop-color="#4ade80"/>
              </radialGradient>
              <radialGradient id="sunGrad">
                <stop offset="0%" stop-color="#fde68a"/>
                <stop offset="100%" stop-color="#fbbf24"/>
              </radialGradient>
              <radialGradient id="sunGlow">
                <stop offset="0%" stop-color="#fde68a"/>
                <stop offset="100%" stop-color="transparent"/>
              </radialGradient>
              <linearGradient id="grassGrad" x1="20" y1="345" x2="460" y2="385">
                <stop offset="0%" stop-color="#86efac"/>
                <stop offset="50%" stop-color="#4ade80"/>
                <stop offset="100%" stop-color="#86efac"/>
              </linearGradient>
            </defs>
          </svg>

          <div class="illust-text">
            <h3>让家的每一刻都井井有条</h3>
            <p>记账 · 相册 · 物品管理，一站式家庭管家</p>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="form-area">
        <div class="login-card">
          <!-- Logo -->
          <div class="card-logo">
            <div class="logo-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
          </div>

          <h2 class="card-title">欢迎回来</h2>
          <p class="card-subtitle">登录您的家庭管家账号</p>

          <el-form :model="form" :rules="rules" ref="formRef" size="large" @submit.prevent="handleLogin">
            <el-form-item prop="username">
              <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="form.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" native-type="submit" :loading="loading" class="login-btn">
                <span v-if="!loading">登 录</span>
                <span v-else>登录中...</span>
              </el-button>
            </el-form-item>
          </el-form>

          <div class="card-footer">
            还没有账号？<router-link to="/register">立即注册</router-link>
          </div>
        </div>

        <p class="copyright">© {{ new Date().getFullYear() }} 家庭管家 · 让家更美好</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const formRef = ref(null)
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await authStore.login(form)
    ElMessage.success('登录成功')
  } catch { /* handled by interceptor */ }
  finally { loading.value = false }
}
</script>

<style scoped>
/* ========== 页面容器 ========== */
.login-page {
  height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
}

/* ========== 背景渐变 ========== */
.bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 25%, #f5f0ff 50%, #eef5ff 75%, #f8f4ff 100%);
  z-index: 0;
}
.bg-gradient::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.08) 0%, transparent 70%);
  border-radius: 50%;
}
.bg-gradient::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(118, 75, 162, 0.06) 0%, transparent 70%);
  border-radius: 50%;
}

/* ========== 浮动装饰 ========== */
.floating-shapes {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}
.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.12;
}
.shape-1 {
  width: 300px; height: 300px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  top: -80px; right: -60px;
  animation: floatSlow 20s ease-in-out infinite;
}
.shape-2 {
  width: 200px; height: 200px;
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  bottom: -40px; left: -40px;
  animation: floatSlow 25s ease-in-out infinite reverse;
}
.shape-3 {
  width: 120px; height: 120px;
  background: linear-gradient(135deg, #f472b6, #a78bfa);
  top: 30%; left: 8%;
  animation: floatSlow 18s ease-in-out infinite 2s;
}
.shape-4 {
  width: 80px; height: 80px;
  background: linear-gradient(135deg, #34d399, #60a5fa);
  top: 15%; right: 25%;
  animation: floatSlow 22s ease-in-out infinite 4s;
}
.shape-5 {
  width: 60px; height: 60px;
  background: linear-gradient(135deg, #fbbf24, #f472b6);
  bottom: 20%; right: 10%;
  animation: floatSlow 16s ease-in-out infinite 1s;
}
.shape-6 {
  width: 100px; height: 100px;
  background: linear-gradient(135deg, #60a5fa, #34d399);
  bottom: 35%; left: 25%;
  animation: floatSlow 20s ease-in-out infinite 3s;
}
.shape-ring {
  border-radius: 50%;
  background: none !important;
  border: 3px solid;
  opacity: 0.08;
}
.ring-1 {
  width: 180px; height: 180px;
  border-color: #667eea;
  top: 50%; right: 15%;
  animation: floatSlow 24s ease-in-out infinite 5s;
}
.ring-2 {
  width: 100px; height: 100px;
  border-color: #a78bfa;
  top: 10%; left: 30%;
  animation: floatSlow 19s ease-in-out infinite 2s;
}

@keyframes floatSlow {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(15px, -20px) rotate(5deg); }
  50% { transform: translate(-10px, 15px) rotate(-3deg); }
  75% { transform: translate(20px, 10px) rotate(4deg); }
}

/* ========== 主布局 ========== */
.login-wrapper {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 60px;
  padding: 40px;
  max-width: 1100px;
  margin: 0 auto;
}

/* ========== 左侧插画 ========== */
.illustration-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: slideInLeft 0.8s ease-out;
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-40px); }
  to { opacity: 1; transform: translateX(0); }
}

.illust-card {
  text-align: center;
}

.home-illustration {
  width: 100%;
  max-width: 420px;
  height: auto;
  filter: drop-shadow(0 10px 30px rgba(102, 126, 234, 0.15));
}

/* SVG 动画 */
.smoke { animation: smokeRise 4s ease-in-out infinite; }
.smoke-1 { animation-delay: 0s; }
.smoke-2 { animation-delay: 1.3s; }
.smoke-3 { animation-delay: 2.6s; }
@keyframes smokeRise {
  0% { opacity: 0; transform: translateY(0) scale(1); }
  50% { opacity: 0.3; }
  100% { opacity: 0; transform: translateY(-25px) scale(1.5); }
}

.sun { animation: sunPulse 4s ease-in-out infinite; }
@keyframes sunPulse {
  0%, 100% { r: 30; opacity: 0.6; }
  50% { r: 33; opacity: 0.75; }
}

.sun-glow { animation: sunGlowPulse 4s ease-in-out infinite; }
@keyframes sunGlowPulse {
  0%, 100% { r: 45; opacity: 0.15; }
  50% { r: 55; opacity: 0.25; }
}

.cloud-1 { animation: cloudDrift 30s linear infinite; }
.cloud-2 { animation: cloudDrift 40s linear infinite reverse; }
@keyframes cloudDrift {
  0% { transform: translateX(0); }
  100% { transform: translateX(80px); }
}

.bird-1 { animation: birdFly 12s ease-in-out infinite; }
.bird-2 { animation: birdFly 15s ease-in-out infinite 3s; }
@keyframes birdFly {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(20px, -8px); }
  50% { transform: translate(40px, -3px); }
  75% { transform: translate(25px, -10px); }
}

.heart-float { animation: heartFloat 5s ease-in-out infinite; }
@keyframes heartFloat {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
  50% { transform: translateY(-10px) scale(1.1); opacity: 0.7; }
}

.flower { animation: flowerSway 4s ease-in-out infinite; }
.flower-2 { animation-delay: 1s; }
@keyframes flowerSway {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(3deg); }
  75% { transform: rotate(-3deg); }
}

.illust-text {
  margin-top: 28px;
  animation: fadeInUp 0.8s ease-out 0.3s both;
}
.illust-text h3 {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}
.illust-text p {
  font-size: 14px;
  color: #94a3b8;
  letter-spacing: 0.3px;
}

/* ========== 右侧表单 ========== */
.form-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: slideInRight 0.8s ease-out;
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}

.login-card {
  width: 400px;
  padding: 44px 40px 36px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  box-shadow:
    0 8px 32px rgba(102, 126, 234, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  animation: cardAppear 0.6s ease-out 0.2s both;
}
@keyframes cardAppear {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Logo */
.card-logo {
  text-align: center;
  margin-bottom: 24px;
}
.logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  animation: logoPulse 3s ease-in-out infinite;
}
@keyframes logoPulse {
  0%, 100% { box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3); }
  50% { box-shadow: 0 8px 32px rgba(102, 126, 234, 0.45); }
}

.card-title {
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px;
}
.card-subtitle {
  text-align: center;
  font-size: 14px;
  color: #94a3b8;
  margin: 0 0 32px;
}

/* 表单样式 */
.login-card :deep(.el-form-item) {
  margin-bottom: 22px;
  animation: fadeInUp 0.5s ease-out both;
}
.login-card :deep(.el-form-item:nth-child(1)) { animation-delay: 0.4s; }
.login-card :deep(.el-form-item:nth-child(2)) { animation-delay: 0.5s; }
.login-card :deep(.el-form-item:nth-child(3)) { animation-delay: 0.6s; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.login-card :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.7);
  border: 1.5px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  padding: 4px 12px;
  transition: all 0.3s ease;
}
.login-card :deep(.el-input__wrapper:hover) {
  border-color: #a5b4fc;
  background: rgba(255, 255, 255, 0.85);
}
.login-card :deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.12);
  background: #fff;
}
.login-card :deep(.el-input__inner) {
  color: #1e293b;
  font-size: 15px;
}
.login-card :deep(.el-input__inner::placeholder) {
  color: #94a3b8;
}
.login-card :deep(.el-input__prefix) {
  color: #94a3b8;
}
.login-card :deep(.el-input__prefix .el-icon) {
  font-size: 18px;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.35s ease;
  margin-top: 4px;
  position: relative;
  overflow: hidden;
}
.login-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  opacity: 0;
  transition: opacity 0.35s ease;
}
.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(102, 126, 234, 0.4);
}
.login-btn:hover::before {
  opacity: 1;
}
.login-btn:active {
  transform: translateY(0);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}
.login-btn span {
  position: relative;
  z-index: 1;
}

/* 底部链接 */
.card-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #94a3b8;
  animation: fadeInUp 0.5s ease-out 0.7s both;
}
.card-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}
.card-footer a:hover {
  color: #764ba2;
}

.copyright {
  margin-top: 24px;
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
  animation: fadeInUp 0.5s ease-out 0.9s both;
}

/* ========== 响应式 ========== */
@media (max-width: 900px) {
  .login-wrapper {
    flex-direction: column;
    gap: 24px;
    padding: 24px;
  }
  .illustration-area {
    display: none;
  }
  .login-card {
    width: 100%;
    max-width: 400px;
  }
}
</style>
