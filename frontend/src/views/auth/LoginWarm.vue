<template>
  <div class="warm-login">
    <!-- 背景漂浮柔光 -->
    <div class="ambient-dot dot-1"></div>
    <div class="ambient-dot dot-2"></div>

    <main class="shell">
      <!-- 左侧：手绘风暖景插画 -->
      <section class="scene" aria-hidden="true">
        <svg viewBox="0 0 400 340" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 暖光灯光晕 -->
          <circle class="lamp-glow" cx="115" cy="185" r="72" fill="#F5D3A0" opacity="0.5"/>
          <circle class="lamp-glow" cx="115" cy="185" r="46" fill="#F8DFB4" opacity="0.6"/>
          <!-- 窗户 -->
          <rect x="230" y="52" width="120" height="150" rx="16" fill="#FBF3E4" stroke="#D9BE9C" stroke-width="4"/>
          <line x1="290" y1="56" x2="290" y2="198" stroke="#D9BE9C" stroke-width="4"/>
          <line x1="234" y1="127" x2="346" y2="127" stroke="#D9BE9C" stroke-width="4"/>
          <!-- 窗外月亮与云 -->
          <circle cx="263" cy="95" r="15" fill="#F3CE8F"/>
          <path d="M305 100 q10 -10 20 0 q8 -7 15 1" stroke="#E4C8A4" stroke-width="3.5" stroke-linecap="round" fill="none"/>
          <!-- 窗台绿植 -->
          <g class="leaf-sway">
            <path d="M258 200 q-3 -26 -16 -34 q14 2 19 20 q2 -22 -6 -34 q12 8 12 34 q6 -16 16 -19 q-6 14 -11 33 Z" fill="#A8B08A" opacity="0.9"/>
          </g>
          <path d="M247 198 h26 l-4 24 h-18 Z" fill="#C89F85"/>
          <!-- 桌子 -->
          <rect x="60" y="228" width="200" height="10" rx="5" fill="#D9BE9C"/>
          <rect x="78" y="238" width="8" height="52" rx="4" fill="#CBA97F"/>
          <rect x="234" y="238" width="8" height="52" rx="4" fill="#CBA97F"/>
          <!-- 台灯 -->
          <rect x="112" y="180" width="7" height="48" rx="3.5" fill="#A08D7A"/>
          <path d="M92 182 q23 -26 47 0 Z" fill="#C89F85"/>
          <ellipse cx="115.5" cy="228" rx="20" ry="5" fill="#A08D7A"/>
          <!-- 热茶 -->
          <path d="M178 214 h30 v10 q0 8 -15 8 q-15 0 -15 -8 Z" fill="#E8D5C4" stroke="#C9A983" stroke-width="2.5"/>
          <path d="M186 206 q3 -6 0 -11 M196 206 q3 -6 0 -11" stroke="#D9BE9C" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <!-- 书 -->
          <rect x="64" y="216" width="42" height="11" rx="4" fill="#B08466"/>
          <rect x="68" y="211" width="34" height="8" rx="4" fill="#D3A98B"/>
          <!-- 地毯 -->
          <ellipse cx="160" cy="298" rx="130" ry="16" fill="#EBD9C0"/>
          <!-- 远处小屋 -->
          <path d="M30 292 v-40 l26 -20 26 20 v40 Z" fill="#DFC7A8"/>
          <rect x="48" y="268" width="14" height="24" rx="3" fill="#B08466"/>
          <circle cx="39" cy="266" r="4.5" fill="#F3CE8F"/>
        </svg>

        <p class="scene-quote">
          灯光为你留着，<br>
          这里存放着 <strong>属于你们的温暖时光</strong>。
        </p>
      </section>

      <!-- 右侧：登录表单 -->
      <section class="form-side">
        <div class="brand">
          <div class="brand-badge">🏡</div>
          <span class="brand-name">家 · 私享空间</span>
        </div>

        <h1>欢迎回家 🌙</h1>
        <p class="subtitle">家人都在等你，说说今天的小确幸吧</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          @submit.prevent="handleLogin"
        >
          <!-- 账号 -->
          <div class="field">
            <span class="field-icon">🧸</span>
            <el-input
              v-model="form.username"
              placeholder="请输入您的账号"
              size="large"
              @focus="focusField = 'username'"
              @blur="focusField = ''"
            />
          </div>

          <!-- 密码 -->
          <div class="field">
            <span class="field-icon">🔑</span>
            <el-input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="您的家门钥匙"
              size="large"
              @focus="focusField = 'password'"
              @blur="focusField = ''"
            >
              <template #suffix>
                <span class="eye-toggle" @click="showPassword = !showPassword">
                  <el-icon v-if="showPassword"><View /></el-icon>
                  <el-icon v-else><Hide /></el-icon>
                </span>
              </template>
            </el-input>
          </div>

          <!-- 记住我 / 忘记密码 -->
          <div class="row-between">
            <label class="remember">
              <input type="checkbox" v-model="rememberMe">
              <span class="box">✓</span>
              下次自动为我开门
            </label>
            <a class="link" href="#">忘记钥匙了？</a>
          </div>

          <!-- 错误提示 -->
          <div v-if="errorMsg" class="error-box">{{ errorMsg }}</div>

          <!-- 登录按钮 -->
          <el-form-item style="margin-bottom: 0;">
            <button class="btn-home" type="submit" :disabled="loading">
              {{ loading ? '开门中...' : '推 开 家 门' }}
            </button>
          </el-form-item>
        </el-form>

        <!-- 分隔线 -->
        <div class="divider">有新家人要加入吗</div>

        <!-- 注册入口 -->
        <div class="invite-card" @click="router.push('/register')">
          <div class="invite-text">
            <b>收到家人的邀请？</b><br>
            注册新账号，搬进这个家 ✨
          </div>
          <span class="invite-emoji">💌</span>
        </div>

        <p class="footer-note">🔒 这个空间只属于你们 · 所有回忆都被温柔守护</p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import { View, Hide } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref(null)
const loading = ref(false)
const errorMsg = ref('')
const showPassword = ref(false)
const focusField = ref('')
const rememberMe = ref(true)

const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    errorMsg.value = ''
    try {
      await authStore.login(form)
      ElMessage.success('欢迎回家')
    } catch (e) {
      errorMsg.value = e.response?.data?.message || '账号或密码有误，请重新输入'
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.warm-login {
  --warm-white: #FBF6EF;
  --cream: #F3EADD;
  --apricot: #EDE0CE;
  --wood-light: #E2CDB2;
  --terracotta: #C89F85;
  --terracotta-d: #B08466;
  --text-deep: #6B5744;
  --text-soft: #A08D7A;
  --glow: rgba(230, 190, 150, 0.45);
  --card-shadow: 0 16px 48px rgba(160, 120, 90, 0.14);
  --radius-lg: 24px;
  --radius-md: 16px;
  --radius-sm: 12px;

  height: 100vh;
  background: linear-gradient(135deg, var(--warm-white) 0%, var(--cream) 55%, #F0E2D0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: var(--text-deep);
  overflow: hidden;
  position: relative;
  font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

/* 背景漂浮柔光 */
.ambient-dot {
  position: fixed;
  border-radius: 50%;
  filter: blur(60px);
  opacity: .5;
  pointer-events: none;
  animation: drift 14s ease-in-out infinite alternate;
}
.dot-1 { width: 260px; height: 260px; background: #F2D9B8; top: -60px; left: -40px; }
.dot-2 { width: 200px; height: 200px; background: #E8C9AE; bottom: -40px; right: -30px; animation-delay: -6s; }
@keyframes drift {
  from { transform: translate(0,0) scale(1); }
  to   { transform: translate(30px, 24px) scale(1.08); }
}

/* 主容器 */
.shell {
  display: flex;
  width: min(780px, 100%);
  max-height: calc(100vh - 40px);
  background: rgba(255, 252, 247, 0.82);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-lg);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  border: 1px solid rgba(226, 205, 178, 0.6);
  animation: rise .8s ease both;
  position: relative;
  z-index: 1;
}
@keyframes rise {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* 左侧插画区 */
.scene {
  flex: 1;
  background: linear-gradient(160deg, #F6E7D3 0%, #EEDCC4 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
}
.scene svg { width: 100%; max-width: 280px; height: auto; }

.lamp-glow { animation: breathe 3.6s ease-in-out infinite; transform-origin: center; }
@keyframes breathe {
  0%, 100% { opacity: .45; transform: scale(1); }
  50%      { opacity: .8;  transform: scale(1.06); }
}
.leaf-sway { animation: sway 5s ease-in-out infinite; transform-origin: bottom center; }
@keyframes sway {
  0%, 100% { transform: rotate(-2deg); }
  50%      { transform: rotate(2.5deg); }
}
.scene-quote {
  margin-top: 28px;
  text-align: center;
  font-size: 15px;
  line-height: 1.9;
  color: var(--text-soft);
  letter-spacing: .06em;
}
.scene-quote strong { color: var(--terracotta-d); font-weight: 600; }

/* 右侧表单区 */
.form-side {
  flex: 1;
  padding: 36px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow-y: auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.brand-badge {
  width: 38px; height: 38px;
  background: linear-gradient(135deg, var(--terracotta), #D9B697);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(200, 159, 133, .3);
}
.brand-name { font-size: 14px; letter-spacing: .12em; color: var(--text-soft); }

h1 {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: .04em;
  margin-bottom: 6px;
}
.subtitle {
  font-size: 13px;
  color: var(--text-soft);
  margin-bottom: 24px;
  letter-spacing: .05em;
}

/* 输入框 */
.field {
  position: relative;
  margin-bottom: 16px;
}
.field :deep(.el-input__wrapper) {
  padding: 4px 14px 4px 40px;
  border: 1.5px solid var(--wood-light);
  border-radius: var(--radius-md);
  background: #FFFDF9;
  box-shadow: none;
  min-height: 44px;
  transition: border-color .35s, box-shadow .35s, transform .35s;
}
.field :deep(.el-input__wrapper:hover) {
  border-color: var(--terracotta);
}
.field :deep(.el-input__wrapper.is-focus) {
  border-color: var(--terracotta);
  background: #fff;
  transform: translateY(-2px);
  box-shadow: 0 6px 22px var(--glow), 0 0 0 4px rgba(200, 159, 133, .12);
}
.field :deep(.el-input__inner) {
  font-size: 15px;
  color: var(--text-deep);
}
.field :deep(.el-input__inner::placeholder) {
  color: var(--text-soft);
}
.field-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  z-index: 2;
  pointer-events: none;
  transition: transform .35s;
}
.field :deep(.el-input__wrapper.is-focus) ~ .field-icon {
  transform: translateY(-50%) scale(1.15);
}

.eye-toggle {
  color: var(--text-soft);
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  transition: color .2s;
}
.eye-toggle:hover { color: var(--text-deep); }

/* 记住我 / 忘记密码 */
.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 2px 0 20px;
  font-size: 13px;
}
.remember {
  display: flex; align-items: center; gap: 6px;
  cursor: pointer; color: var(--text-soft);
  user-select: none;
}
.remember input { display: none; }
.remember .box {
  width: 17px; height: 17px;
  border: 1.5px solid var(--wood-light);
  border-radius: 6px;
  background: #FFFDF9;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; color: transparent;
  transition: all .25s ease;
}
.remember input:checked + .box {
  background: var(--terracotta);
  border-color: var(--terracotta);
  color: #fff;
  transform: scale(1.08);
}
.link {
  color: var(--terracotta-d);
  text-decoration: none;
  border-bottom: 1px dashed rgba(176, 132, 102, .4);
  padding-bottom: 1px;
  transition: color .25s, border-color .25s;
}
.link:hover { color: #96684A; border-color: #96684A; }

/* 错误提示 */
.error-box {
  padding: 10px 14px;
  font-size: 13px;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin-bottom: 16px;
}

/* 主按钮 */
.btn-home {
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--terracotta) 0%, #D3A98B 100%);
  color: #FFF9F2;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: .2em;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(200, 159, 133, .35);
  transition: transform .3s ease, box-shadow .3s ease;
}
.btn-home:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 30px rgba(200, 159, 133, .5);
}
.btn-home:active { transform: translateY(-1px) scale(.99); }
.btn-home:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* 分隔线 */
.divider {
  display: flex; align-items: center; gap: 14px;
  margin: 20px 0 14px;
  color: var(--text-soft);
  font-size: 12px;
  letter-spacing: .1em;
}
.divider::before, .divider::after {
  content: ""; flex: 1; height: 1px;
  background: linear-gradient(to right, transparent, var(--wood-light), transparent);
}

/* 注册卡片 */
.invite-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border: 1.5px dashed var(--wood-light);
  border-radius: var(--radius-sm);
  background: rgba(243, 234, 221, .5);
  transition: all .3s ease;
  cursor: pointer;
}
.invite-card:hover {
  border-color: var(--terracotta);
  background: rgba(243, 234, 221, .9);
  transform: translateY(-2px);
}
.invite-text { font-size: 12.5px; color: var(--text-soft); line-height: 1.5; }
.invite-text b { color: var(--text-deep); font-weight: 600; }
.invite-emoji { font-size: 22px; }

.footer-note {
  margin-top: 20px;
  text-align: center;
  font-size: 11px;
  color: #BCAB97;
  letter-spacing: .08em;
}

/* 响应式 */
@media (max-width: 768px) {
  .warm-login {
    padding: 0;
    align-items: flex-start;
    overflow-y: auto;
  }
  .shell {
    flex-direction: column;
    width: 100%;
    max-height: none;
    min-height: 100vh;
    border-radius: 0;
    border: none;
  }
  .scene {
    padding: 40px 24px 24px;
    flex: none;
  }
  .scene svg { max-width: 180px; }
  .scene-quote {
    font-size: 13px;
    margin-top: 12px;
    line-height: 1.7;
  }
  .form-side {
    padding: 24px 20px 40px;
    flex: 1;
  }
  .brand { margin-bottom: 16px; }
  h1 {
    font-size: 22px;
    margin-bottom: 4px;
  }
  .subtitle {
    font-size: 12px;
    margin-bottom: 20px;
  }
  .field { margin-bottom: 14px; }
  .field :deep(.el-input__wrapper) {
    min-height: 42px;
  }
  .row-between {
    margin: 2px 0 16px;
    font-size: 12px;
  }
  .btn-home {
    padding: 12px;
    font-size: 14px;
  }
  .divider {
    margin: 16px 0 12px;
    font-size: 11px;
  }
  .invite-card {
    padding: 10px 12px;
  }
  .invite-text { font-size: 12px; }
  .invite-emoji { font-size: 20px; }
  .footer-note {
    margin-top: 16px;
    font-size: 10px;
  }
}

/* 小屏手机 */
@media (max-width: 375px) {
  .scene {
    padding: 32px 16px 16px;
  }
  .scene svg { max-width: 150px; }
  .scene-quote { font-size: 12px; }
  .form-side {
    padding: 20px 16px 32px;
  }
  h1 { font-size: 20px; }
}
</style>
