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
      <div class="shape shape-ring ring-1"></div>
    </div>

    <!-- 主内容区 -->
    <div class="login-wrapper">
      <!-- 左侧插画 -->
      <div class="illustration-area">
        <div class="illust-card">
          <svg class="home-illustration" viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- 家庭成员 -->
            <!-- 爸爸 -->
            <circle cx="160" cy="160" r="28" fill="url(#personGrad1)" opacity="0.8"/>
            <rect x="140" y="195" width="40" height="60" rx="12" fill="url(#personGrad1)" opacity="0.7"/>
            <!-- 妈妈 -->
            <circle cx="240" cy="150" r="26" fill="url(#personGrad2)" opacity="0.8"/>
            <rect x="222" y="182" width="36" height="55" rx="10" fill="url(#personGrad2)" opacity="0.7"/>
            <!-- 孩子 -->
            <circle cx="320" cy="175" r="20" fill="url(#personGrad3)" opacity="0.8"/>
            <rect x="306" y="200" width="28" height="45" rx="8" fill="url(#personGrad3)" opacity="0.7"/>
            <!-- 手牵手 -->
            <line x1="180" y1="220" x2="222" y2="210" stroke="#a78bfa" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
            <line x1="258" y1="210" x2="306" y2="220" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
            <!-- 爱心 -->
            <g class="heart-float">
              <path d="M240 110 C240 105, 248 100, 248 107 C248 112, 240 118, 240 118 C240 118, 232 112, 232 107 C232 100, 240 105, 240 110Z" fill="#ff6b8a" opacity="0.5"/>
            </g>
            <!-- 房子背景 -->
            <rect x="100" y="260" width="280" height="80" rx="6" fill="url(#houseGrad)" opacity="0.25"/>
            <path d="M80 265 L240 210 L400 265" stroke="url(#roofGrad)" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.3"/>
            <!-- 草地 -->
            <ellipse cx="240" cy="345" rx="200" ry="15" fill="url(#grassGrad)" opacity="0.2"/>
            <!-- 装饰星星 -->
            <circle class="star star-1" cx="120" cy="100" r="3" fill="#fbbf24" opacity="0.5"/>
            <circle class="star star-2" cx="380" cy="80" r="2.5" fill="#a78bfa" opacity="0.5"/>
            <circle class="star star-3" cx="90" cy="200" r="2" fill="#60a5fa" opacity="0.5"/>
            <circle class="star star-4" cx="400" cy="180" r="3" fill="#f472b6" opacity="0.4"/>
            <circle class="star star-5" cx="200" cy="60" r="2" fill="#34d399" opacity="0.5"/>
            <defs>
              <linearGradient id="personGrad1" x1="140" y1="150" x2="180" y2="260">
                <stop offset="0%" stop-color="#667eea"/>
                <stop offset="100%" stop-color="#5a67d8"/>
              </linearGradient>
              <linearGradient id="personGrad2" x1="222" y1="140" x2="258" y2="240">
                <stop offset="0%" stop-color="#f472b6"/>
                <stop offset="100%" stop-color="#ec4899"/>
              </linearGradient>
              <linearGradient id="personGrad3" x1="306" y1="165" x2="334" y2="250">
                <stop offset="0%" stop-color="#34d399"/>
                <stop offset="100%" stop-color="#10b981"/>
              </linearGradient>
              <linearGradient id="houseGrad" x1="100" y1="260" x2="380" y2="340">
                <stop offset="0%" stop-color="#e8dff5"/>
                <stop offset="100%" stop-color="#d4c5f0"/>
              </linearGradient>
              <linearGradient id="roofGrad" x1="80" y1="265" x2="400" y2="265">
                <stop offset="0%" stop-color="#667eea"/>
                <stop offset="100%" stop-color="#764ba2"/>
              </linearGradient>
              <linearGradient id="grassGrad" x1="40" y1="330" x2="440" y2="360">
                <stop offset="0%" stop-color="#86efac"/>
                <stop offset="50%" stop-color="#4ade80"/>
                <stop offset="100%" stop-color="#86efac"/>
              </linearGradient>
            </defs>
          </svg>

          <div class="illust-text">
            <h3>开启家庭管理新方式</h3>
            <p>注册即享智能记账、家庭相册、物品管理</p>
          </div>
        </div>
      </div>

      <!-- 右侧注册表单 -->
      <div class="form-area">
        <div class="login-card">
          <div class="card-logo">
            <div class="logo-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
          </div>

          <h2 class="card-title">创建账号</h2>
          <p class="card-subtitle">注册您的家庭管家</p>

          <el-form :model="form" :rules="rules" ref="formRef" size="large" @submit.prevent="handleRegister">
            <el-form-item prop="username">
              <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="form.password" type="password" placeholder="请输入密码（至少6位）" :prefix-icon="Lock" show-password />
            </el-form-item>
            <el-form-item prop="familyName">
              <el-input v-model="form.familyName" placeholder="家庭名称（可选，创建家庭）" :prefix-icon="HomeFilled" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" native-type="submit" :loading="loading" class="login-btn">
                <span v-if="!loading">注 册</span>
                <span v-else>注册中...</span>
              </el-button>
            </el-form-item>
          </el-form>

          <div class="card-footer">
            已有账号？<router-link to="/login">立即登录</router-link>
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
import { User, Lock, HomeFilled } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const formRef = ref(null)
const loading = ref(false)
const form = reactive({ username: '', password: '', familyName: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '密码至少6位', trigger: 'blur' }]
}

async function handleRegister() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await authStore.register(form)
    ElMessage.success('注册成功')
  } catch { /* handled */ }
  finally { loading.value = false }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
}

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
.shape-1 { width: 300px; height: 300px; background: linear-gradient(135deg, #667eea, #764ba2); top: -80px; right: -60px; animation: floatSlow 20s ease-in-out infinite; }
.shape-2 { width: 200px; height: 200px; background: linear-gradient(135deg, #a78bfa, #60a5fa); bottom: -40px; left: -40px; animation: floatSlow 25s ease-in-out infinite reverse; }
.shape-3 { width: 120px; height: 120px; background: linear-gradient(135deg, #f472b6, #a78bfa); top: 30%; left: 8%; animation: floatSlow 18s ease-in-out infinite 2s; }
.shape-4 { width: 80px; height: 80px; background: linear-gradient(135deg, #34d399, #60a5fa); top: 15%; right: 25%; animation: floatSlow 22s ease-in-out infinite 4s; }
.shape-5 { width: 60px; height: 60px; background: linear-gradient(135deg, #fbbf24, #f472b6); bottom: 20%; right: 10%; animation: floatSlow 16s ease-in-out infinite 1s; }
.shape-ring { border-radius: 50%; background: none !important; border: 3px solid; opacity: 0.08; }
.ring-1 { width: 180px; height: 180px; border-color: #667eea; top: 50%; right: 15%; animation: floatSlow 24s ease-in-out infinite 5s; }

@keyframes floatSlow {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(15px, -20px) rotate(5deg); }
  50% { transform: translate(-10px, 15px) rotate(-3deg); }
  75% { transform: translate(20px, 10px) rotate(4deg); }
}

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

.illust-card { text-align: center; }

.home-illustration {
  width: 100%;
  max-width: 420px;
  height: auto;
  filter: drop-shadow(0 10px 30px rgba(102, 126, 234, 0.15));
}

.heart-float { animation: heartFloat 5s ease-in-out infinite; }
@keyframes heartFloat {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
  50% { transform: translateY(-10px) scale(1.1); opacity: 0.7; }
}

.star { animation: starTwinkle 3s ease-in-out infinite; }
.star-1 { animation-delay: 0s; }
.star-2 { animation-delay: 0.6s; }
.star-3 { animation-delay: 1.2s; }
.star-4 { animation-delay: 1.8s; }
.star-5 { animation-delay: 2.4s; }
@keyframes starTwinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.3); }
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
}
.illust-text p {
  font-size: 14px;
  color: #94a3b8;
}

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

.card-logo { text-align: center; margin-bottom: 24px; }
.logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
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

.login-card :deep(.el-form-item) {
  margin-bottom: 22px;
  animation: fadeInUp 0.5s ease-out both;
}
.login-card :deep(.el-form-item:nth-child(1)) { animation-delay: 0.4s; }
.login-card :deep(.el-form-item:nth-child(2)) { animation-delay: 0.5s; }
.login-card :deep(.el-form-item:nth-child(3)) { animation-delay: 0.6s; }
.login-card :deep(.el-form-item:nth-child(4)) { animation-delay: 0.7s; }

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
.login-btn:hover::before { opacity: 1; }
.login-btn:active { transform: translateY(0); }
.login-btn span { position: relative; z-index: 1; }

.card-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #94a3b8;
  animation: fadeInUp 0.5s ease-out 0.8s both;
}
.card-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}
.card-footer a:hover { color: #764ba2; }

.copyright {
  margin-top: 24px;
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
  animation: fadeInUp 0.5s ease-out 1s both;
}

@media (max-width: 900px) {
  .login-wrapper {
    flex-direction: column;
    gap: 24px;
    padding: 24px;
  }
  .illustration-area { display: none; }
  .login-card { width: 100%; max-width: 400px; }
}
</style>
