<template>
  <div class="animated-login">
    <!-- 左侧：品牌视觉区 -->
    <div class="left-panel">
      <div class="left-top">
        <div class="brand-mark">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="white" fill-opacity="0.15" />
            <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="white" fill-opacity="0.9" />
            <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="white" fill-opacity="0.5" />
          </svg>
        </div>
        <span class="brand-name">家庭管家</span>
      </div>

      <!-- 动画角色 -->
      <div class="characters-area" ref="charactersRef">
        <!-- 橙色半圆（最前面，左侧） -->
        <div class="char-block char-orange" ref="orangeRef">
          <div class="char-face" ref="orangeFaceRef">
            <div class="eye-round"><div class="pupil-dot" data-max="5"></div></div>
            <div class="eye-round"><div class="pupil-dot" data-max="5"></div></div>
          </div>
        </div>

        <!-- 紫色高方块 -->
        <div class="char-block char-purple" ref="purpleRef">
          <div class="char-face" ref="purpleFaceRef">
            <div class="eye-oval" data-max="5"><div class="eyeball-pupil"></div></div>
            <div class="eye-oval" data-max="5"><div class="eyeball-pupil"></div></div>
          </div>
        </div>

        <!-- 黑色窄方块 -->
        <div class="char-block char-black" ref="blackRef">
          <div class="char-face" ref="blackFaceRef">
            <div class="eye-oval small" data-max="4"><div class="eyeball-pupil"></div></div>
            <div class="eye-oval small" data-max="4"><div class="eyeball-pupil"></div></div>
          </div>
        </div>

        <!-- 黄色半圆（右侧） -->
        <div class="char-block char-yellow" ref="yellowRef">
          <div class="char-face" ref="yellowFaceRef">
            <div class="eye-round"><div class="pupil-dot" data-max="5"></div></div>
            <div class="eye-round"><div class="pupil-dot" data-max="5"></div></div>
          </div>
          <div class="char-mouth" ref="yellowMouthRef"></div>
        </div>
      </div>

      <div class="left-footer">
        <a href="#">帮助中心</a>
        <a href="#">隐私政策</a>
      </div>

      <div class="decor-blur-1"></div>
      <div class="decor-blur-2"></div>
      <div class="decor-grid"></div>
    </div>

    <!-- 右侧：登录表单 -->
    <div class="right-panel">
      <div class="form-wrapper">
        <!-- 移动端 Logo -->
        <div class="mobile-logo">
          <div class="mobile-logo-icon">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="#1E40AF" fill-opacity="0.9" />
              <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="#3B82F6" fill-opacity="0.7" />
            </svg>
          </div>
          <span>家庭管家</span>
        </div>

        <div class="form-header">
          <h1 class="form-title">登录到家庭管家</h1>
          <p class="form-subtitle">管理家庭财务、相册、物品的一站式平台</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          @submit.prevent="handleLogin"
          size="large"
          class="login-form"
        >
          <div class="field-label">账号</div>
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="输入您的账号"
              :prefix-icon="User"
              @focus="focusField = 'username'"
              @blur="focusField = ''"
            />
          </el-form-item>

          <div class="field-label">密码</div>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="输入您的密码"
              :prefix-icon="Lock"
              @focus="focusField = 'password'"
              @blur="focusField = ''"
              @input="onPasswordInput"
            >
              <template #suffix>
                <span class="eye-toggle" @click="showPassword = !showPassword">
                  <el-icon v-if="showPassword"><View /></el-icon>
                  <el-icon v-else><Hide /></el-icon>
                </span>
              </template>
            </el-input>
          </el-form-item>

          <div v-if="errorMsg" class="error-box">{{ errorMsg }}</div>

          <el-form-item style="margin-bottom:0;">
            <el-button
              type="primary"
              native-type="submit"
              :loading="loading"
              class="submit-btn"
            >
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="divider"><span>或</span></div>

        <el-button
          class="register-btn"
          @click="router.push('/register')"
        >
          <el-icon><UserFilled /></el-icon>
          注册新账号
        </el-button>

        <div class="signup-row">
          暂无账号？ <router-link to="/register" class="signup-link">立即注册</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import { User, Lock, View, Hide, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref(null)
const loading = ref(false)
const errorMsg = ref('')
const isTyping = ref(false)
const showPassword = ref(false)
const focusField = ref('') // 'username' | 'password' | ''
const charactersRef = ref(null)

const purpleRef = ref(null)
const blackRef = ref(null)
const orangeRef = ref(null)
const yellowRef = ref(null)
const purpleFaceRef = ref(null)
const blackFaceRef = ref(null)
const orangeFaceRef = ref(null)
const yellowFaceRef = ref(null)
const yellowMouthRef = ref(null)

const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }]
}

let rafId = 0
let mouse = { x: 0, y: 0 }
let blinkTimers = []

function lerp(a, b, t) { return a + (b - a) * t }

function calcBodySkew(el) {
  if (!el) return 0
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const dx = mouse.x - cx
  return Math.max(-6, Math.min(6, -dx / 120))
}

function calcFacePos(el) {
  if (!el) return { x: 0, y: 0 }
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 3
  const dx = mouse.x - cx
  const dy = mouse.y - cy
  return {
    x: Math.max(-12, Math.min(12, dx / 20)),
    y: Math.max(-8, Math.min(8, dy / 30))
  }
}

function calcEyePos(el, maxDist) {
  if (!el) return { x: 0, y: 0 }
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const dx = mouse.x - cx
  const dy = mouse.y - cy
  const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist)
  const angle = Math.atan2(dy, dx)
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
}

// 当前状态缓存
let cur = {
  purpleSkew: 0, blackSkew: 0, orangeSkew: 0, yellowSkew: 0,
  purpleFaceX: 0, purpleFaceY: 0,
  blackFaceX: 0, blackFaceY: 0,
  orangeFaceX: 0, orangeFaceY: 0,
  yellowFaceX: 0, yellowFaceY: 0,
  purpleX: 0, blackX: 0
}

function tick() {
  const onUsername = focusField.value === 'username'
  const onPassword = focusField.value === 'password'
  const hiding = onPassword && !showPassword.value
  const showing = onPassword && showPassword.value && form.password.length > 0

  // 目标值
  let t = { ...cur }

  if (showing) {
    // 显示密码时：所有角色看向左上方
    t.purpleSkew = 0; t.blackSkew = 0; t.orangeSkew = 0; t.yellowSkew = 0
    t.purpleX = 0; t.blackX = 0
    t.purpleFaceX = -12; t.purpleFaceY = -8
    t.blackFaceX = -10; t.blackFaceY = -6
    t.orangeFaceX = -8; t.orangeFaceY = -6
    t.yellowFaceX = -8; t.yellowFaceY = -6
  } else if (hiding) {
    // 输入密码时：所有角色眼睛看左边
    t.purpleSkew = calcBodySkew(purpleRef.value) - 10
    t.purpleX = -10
    t.purpleFaceX = -15; t.purpleFaceY = 2
    t.blackSkew = calcBodySkew(blackRef.value) - 8
    t.blackX = -8
    t.blackFaceX = -12; t.blackFaceY = 2
    t.orangeSkew = calcBodySkew(orangeRef.value) - 6
    t.orangeFaceX = -10; t.orangeFaceY = 2
    t.yellowSkew = calcBodySkew(yellowRef.value) - 6
    t.yellowFaceX = -10; t.yellowFaceY = 2
  } else if (onUsername) {
    // 输入用户名时：角色互相看
    t.purpleSkew = calcBodySkew(purpleRef.value) - 6
    t.blackSkew = calcBodySkew(blackRef.value) * 1.5 + 4
    t.orangeSkew = calcBodySkew(orangeRef.value)
    t.yellowSkew = calcBodySkew(yellowRef.value)
    t.purpleX = 15; t.blackX = 8
    t.purpleFaceX = 6; t.purpleFaceY = 3
    t.blackFaceX = 4; t.blackFaceY = -2
    const of = calcFacePos(orangeRef.value)
    const yf = calcFacePos(yellowRef.value)
    t.orangeFaceX = of.x; t.orangeFaceY = of.y
    t.yellowFaceX = yf.x; t.yellowFaceY = yf.y
  } else {
    // 默认：跟随鼠标
    t.purpleSkew = calcBodySkew(purpleRef.value)
    t.blackSkew = calcBodySkew(blackRef.value)
    t.orangeSkew = calcBodySkew(orangeRef.value)
    t.yellowSkew = calcBodySkew(yellowRef.value)
    t.purpleX = 0; t.blackX = 0
    const pf = calcFacePos(purpleRef.value)
    const bf = calcFacePos(blackRef.value)
    const of3 = calcFacePos(orangeRef.value)
    const yf3 = calcFacePos(yellowRef.value)
    t.purpleFaceX = pf.x; t.purpleFaceY = pf.y
    t.blackFaceX = bf.x; t.blackFaceY = bf.y
    t.orangeFaceX = of3.x; t.orangeFaceY = of3.y
    t.yellowFaceX = yf3.x; t.yellowFaceY = yf3.y
  }

  // 平滑插值
  const s = 0.12
  for (const k in t) cur[k] = lerp(cur[k], t[k], s)

  // 应用
  if (purpleRef.value) {
    purpleRef.value.style.transform = `skewX(${cur.purpleSkew}deg) translateX(${cur.purpleX}px)`
  }
  if (blackRef.value) {
    blackRef.value.style.transform = `skewX(${cur.blackSkew}deg) translateX(${cur.blackX}px)`
  }
  if (orangeRef.value) {
    orangeRef.value.style.transform = `skewX(${cur.orangeSkew}deg)`
  }
  if (yellowRef.value) {
    yellowRef.value.style.transform = `skewX(${cur.yellowSkew}deg)`
  }
  if (purpleFaceRef.value) {
    purpleFaceRef.value.style.transform = `translate(${cur.purpleFaceX}px, ${cur.purpleFaceY}px)`
  }
  if (blackFaceRef.value) {
    blackFaceRef.value.style.transform = `translate(${cur.blackFaceX}px, ${cur.blackFaceY}px)`
  }
  if (orangeFaceRef.value) {
    orangeFaceRef.value.style.transform = `translate(${cur.orangeFaceX}px, ${cur.orangeFaceY}px)`
  }
  if (yellowFaceRef.value) {
    yellowFaceRef.value.style.transform = `translate(${cur.yellowFaceX}px, ${cur.yellowFaceY}px)`
  }
  if (yellowMouthRef.value) {
    yellowMouthRef.value.style.transform = `translate(${cur.yellowFaceX}px, ${cur.yellowFaceY}px)`
  }

  // 瞳孔跟随
  if (!showing) {
    if (hiding) {
      // 密码输入时：所有瞳孔固定看左边
      document.querySelectorAll('.eyeball-pupil, .pupil-dot').forEach(p => {
        p.style.transform = 'translate(-5px, 0px)'
      })
    } else {
      // 正常跟随鼠标
      document.querySelectorAll('.pupil-dot').forEach(p => {
        const max = Number(p.dataset.max) || 5
        const pos = calcEyePos(p, max)
        p.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      })
      document.querySelectorAll('.eyeball-pupil').forEach(p => {
        const max = Number(p.parentElement?.dataset?.max) || 5
        const pos = calcEyePos(p, max)
        p.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      })
    }
  }

  rafId = requestAnimationFrame(tick)
}

// 随机眨眼
function scheduleBlink() {
  const eyes = document.querySelectorAll('.eye-oval')
  const timer = setTimeout(() => {
    eyes.forEach(el => { el.style.height = '2px' })
    setTimeout(() => {
      eyes.forEach(el => {
        const isSmall = el.classList.contains('small')
        el.style.height = isSmall ? '14px' : '18px'
      })
      scheduleBlink()
    }, 120)
  }, Math.random() * 4000 + 3000)
  blinkTimers.push(timer)
}

function onMove(e) {
  mouse.x = e.clientX
  mouse.y = e.clientY
}

onMounted(() => {
  window.addEventListener('mousemove', onMove, { passive: true })
  rafId = requestAnimationFrame(tick)
  scheduleBlink()
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMove)
  cancelAnimationFrame(rafId)
  blinkTimers.forEach(clearTimeout)
})

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    errorMsg.value = ''
    try {
      await authStore.login(form)
      ElMessage.success('登录成功')
    } catch (e) {
      errorMsg.value = e.response?.data?.message || '账号或密码有误，请重新输入'
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.animated-login {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

/* ─── 左侧面板 ─── */
.left-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px;
  background: linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%);
  overflow: hidden;
}

.left-top {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(8px);
}

.brand-name {
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
}

/* ─── 动画角色 ─── */
.characters-area {
  position: relative;
  z-index: 20;
  width: 100%;
  height: 340px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0;
}

.char-block {
  position: relative;
  flex-shrink: 0;
  transform-origin: bottom center;
  will-change: transform;
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.char-block:not(.back-turned) {
  transition: transform 0.15s ease-out;
}

/* 紫色高方块 */
.char-purple {
  width: 100px;
  height: 260px;
  background: #6C3FF5;
  border-radius: 8px 8px 0 0;
  z-index: 1;
  margin-right: -20px;
}

/* 黑色窄方块 */
.char-black {
  width: 72px;
  height: 200px;
  background: #2D2D2D;
  border-radius: 6px 6px 0 0;
  z-index: 2;
  margin-left: -10px;
  margin-right: -15px;
}

/* 橙色半圆 */
.char-orange {
  width: 140px;
  height: 130px;
  background: #FF9B6B;
  border-radius: 70px 70px 0 0;
  z-index: 3;
  margin-right: -25px;
}

/* 黄色半圆 */
.char-yellow {
  width: 96px;
  height: 160px;
  background: #E8D754;
  border-radius: 48px 48px 0 0;
  z-index: 4;
}

/* 紫色角色密码输入时眼睛看左边，身体左倾 */

/* 脸部定位 */
.char-face {
  position: absolute;
  display: flex;
  align-items: center;
  transition: opacity 0.3s ease;
}

.char-purple .char-face {
  left: 24px;
  top: 30px;
  gap: 22px;
}

.char-black .char-face {
  left: 14px;
  top: 24px;
  gap: 16px;
}

.char-orange .char-face {
  left: 44px;
  top: 42px;
  gap: 22px;
}

.char-yellow .char-face {
  left: 24px;
  top: 28px;
  gap: 18px;
}

/* 椭圆眼白（紫/黑） */
.eye-oval {
  width: 14px;
  height: 18px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: height 0.12s ease;
}

.eye-oval.small {
  width: 12px;
  height: 14px;
}

.eyeball-pupil {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2D2D2D;
  will-change: transform;
  transition: transform 0.08s ease-out;
}

.eye-oval.small .eyeball-pupil {
  width: 5px;
  height: 5px;
}

/* 圆形瞳孔（橙/黄） */
.eye-round {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.pupil-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #2D2D2D;
  will-change: transform;
  transition: transform 0.08s ease-out;
}

/* 嘴巴（黄色角色） */
.char-mouth {
  position: absolute;
  width: 48px;
  height: 3px;
  background: #2D2D2D;
  border-radius: 9999px;
  left: 28px;
  top: 60px;
  will-change: transform;
  transition: opacity 0.3s ease;
}

.left-footer {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 24px;
}

.left-footer a {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  text-decoration: none;
  transition: color 0.2s;
  cursor: pointer;
}

.left-footer a:hover {
  color: rgba(255, 255, 255, 0.85);
}

/* ─── 装饰元素 ─── */
.decor-blur-1 {
  position: absolute;
  top: 15%;
  right: 10%;
  width: 300px;
  height: 300px;
  background: rgba(59, 130, 246, 0.25);
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}

.decor-blur-2 {
  position: absolute;
  bottom: 10%;
  left: 5%;
  width: 400px;
  height: 400px;
  background: rgba(30, 64, 175, 0.3);
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  z-index: 0;
}

.decor-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 1;
}

/* ─── 右侧面板 ─── */
.right-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #ffffff;
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
}

.mobile-logo {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 48px;
}

.mobile-logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.form-title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
  margin: 0 0 10px 0;
  line-height: 1.3;
}

.form-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.login-form {
  margin-bottom: 0;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
  letter-spacing: 0.2px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-input__wrapper) {
  height: 48px;
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: #3b82f6;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #1e40af;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.08);
  background: #ffffff;
}

.login-form :deep(.el-input__inner) {
  font-size: 14px;
  color: #111827;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: #c0c4cc;
}

.login-form :deep(.el-input__prefix) {
  color: #b0b7c3;
  font-size: 15px;
}

.eye-toggle {
  color: #6b7280;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.eye-toggle:hover {
  color: #374151;
}

.error-box {
  padding: 10px 14px;
  font-size: 13px;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin-bottom: 16px;
}

.submit-btn {
  width: 100%;
  height: 48px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  border-radius: 10px !important;
  background: linear-gradient(135deg, #1e40af, #3b82f6) !important;
  border: none !important;
  letter-spacing: 1px;
  transition: all 0.3s ease !important;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(30, 64, 175, 0.35) !important;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 0;
  color: #d1d5db;
  font-size: 13px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.divider span {
  color: #9ca3af;
  white-space: nowrap;
}

.register-btn {
  width: 100%;
  height: 48px !important;
  font-size: 14px !important;
  border-radius: 10px !important;
  margin-top: 12px !important;
  background: #ffffff !important;
  border: 1px solid #e5e7eb !important;
  color: #374151 !important;
  transition: all 0.2s !important;
}

.register-btn:hover {
  background: #eff6ff !important;
  border-color: rgba(30, 64, 175, 0.25) !important;
  color: #1e40af !important;
}

.signup-row {
  text-align: center;
  font-size: 13px;
  color: #6b7280;
  margin-top: 28px;
}

.signup-link {
  color: #1e40af;
  font-weight: 500;
  text-decoration: none;
}

.signup-link:hover {
  text-decoration: underline;
  color: #1d4ed8;
}

/* ─── 响应式 ─── */
@media (max-width: 1024px) {
  .animated-login {
    grid-template-columns: 1fr;
  }

  .left-panel {
    display: none;
  }

  .mobile-logo {
    display: flex;
  }
}
</style>
