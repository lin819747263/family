<template>
  <div class="warm-register">
    <!-- 背景漂浮柔光 -->
    <div class="ambient-dot dot-1"></div>
    <div class="ambient-dot dot-2"></div>

    <main class="shell">
      <!-- 左侧：手绘风暖景插画 -->
      <section class="scene" aria-hidden="true">
        <svg viewBox="0 0 400 340" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 暖光灯光晕 -->
          <circle class="lamp-glow" cx="200" cy="140" r="80" fill="#F5D3A0" opacity="0.4"/>
          <circle class="lamp-glow" cx="200" cy="140" r="50" fill="#F8DFB4" opacity="0.5"/>

          <!-- 家庭成员 - 爸爸 -->
          <circle cx="140" cy="130" r="22" fill="#D9BE9C" opacity="0.8"/>
          <rect x="124" y="158" width="32" height="48" rx="10" fill="#C89F85" opacity="0.7"/>
          <!-- 家庭成员 - 妈妈 -->
          <circle cx="200" cy="120" r="20" fill="#E8D5C4" opacity="0.8"/>
          <rect x="186" y="146" width="28" height="44" rx="8" fill="#D3A98B" opacity="0.7"/>
          <!-- 家庭成员 - 孩子 -->
          <circle cx="260" cy="140" r="16" fill="#F3EADD" opacity="0.8"/>
          <rect x="248" y="162" width="24" height="36" rx="6" fill="#E2CDB2" opacity="0.7"/>

          <!-- 手牵手连线 -->
          <line x1="162" y1="180" x2="186" y2="170" stroke="#C89F85" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
          <line x1="214" y1="170" x2="248" y2="180" stroke="#C89F85" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>

          <!-- 爱心 -->
          <g class="heart-float">
            <path d="M200 90 C200 85, 208 80, 208 87 C208 92, 200 98, 200 98 C200 98, 192 92, 192 87 C192 80, 200 85, 200 90Z" fill="#C89F85" opacity="0.5"/>
          </g>

          <!-- 房子 -->
          <rect x="100" y="220" width="200" height="100" rx="6" fill="#F6E7D3" opacity="0.5"/>
          <path d="M80 228 L200 180 L320 228" stroke="#D9BE9C" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.4"/>
          <!-- 门 -->
          <rect x="175" y="270" width="50" height="50" rx="4" fill="#C89F85" opacity="0.5"/>
          <circle cx="215" cy="298" r="3" fill="#B08466" opacity="0.6"/>
          <!-- 窗户 -->
          <rect x="120" y="240" width="35" height="35" rx="3" fill="#FBF3E4" stroke="#D9BE9C" stroke-width="2" opacity="0.6"/>
          <line x1="137.5" y1="240" x2="137.5" y2="275" stroke="#D9BE9C" stroke-width="1.5" opacity="0.5"/>
          <line x1="120" y1="257.5" x2="155" y2="257.5" stroke="#D9BE9C" stroke-width="1.5" opacity="0.5"/>
          <rect x="245" y="240" width="35" height="35" rx="3" fill="#FBF3E4" stroke="#D9BE9C" stroke-width="2" opacity="0.6"/>
          <line x1="262.5" y1="240" x2="262.5" y2="275" stroke="#D9BE9C" stroke-width="1.5" opacity="0.5"/>
          <line x1="245" y1="257.5" x2="280" y2="257.5" stroke="#D9BE9C" stroke-width="1.5" opacity="0.5"/>

          <!-- 烟囱 -->
          <rect x="270" y="190" width="20" height="35" rx="3" fill="#D9BE9C" opacity="0.5"/>
          <!-- 烟 -->
          <circle class="smoke smoke-1" cx="280" cy="180" r="6" fill="#E2CDB2" opacity="0.3"/>
          <circle class="smoke smoke-2" cx="285" cy="168" r="5" fill="#E2CDB2" opacity="0.2"/>
          <circle class="smoke smoke-3" cx="282" cy="155" r="4" fill="#E2CDB2" opacity="0.15"/>

          <!-- 草地 -->
          <ellipse cx="200" cy="325" rx="180" ry="15" fill="#A8B08A" opacity="0.2"/>

          <!-- 花朵 -->
          <g class="flower flower-1">
            <circle cx="80" cy="310" r="4" fill="#C89F85" opacity="0.6"/>
            <circle cx="80" cy="305" r="2.5" fill="#C89F85" opacity="0.4"/>
            <circle cx="84" cy="308" r="2.5" fill="#C89F85" opacity="0.4"/>
            <circle cx="76" cy="308" r="2.5" fill="#C89F85" opacity="0.4"/>
            <line x1="80" y1="314" x2="80" y2="325" stroke="#A8B08A" stroke-width="1.5" opacity="0.4"/>
          </g>
          <g class="flower flower-2">
            <circle cx="330" cy="305" r="3.5" fill="#D3A98B" opacity="0.5"/>
            <circle cx="330" cy="300" r="2" fill="#D3A98B" opacity="0.35"/>
            <circle cx="333" cy="303" r="2" fill="#D3A98B" opacity="0.35"/>
            <circle cx="327" cy="303" r="2" fill="#D3A98B" opacity="0.35"/>
            <line x1="330" y1="308" x2="330" y2="320" stroke="#A8B08A" stroke-width="1.5" opacity="0.35"/>
          </g>

          <!-- 星星装饰 -->
          <circle class="star star-1" cx="60" cy="80" r="2.5" fill="#F3CE8F" opacity="0.5"/>
          <circle class="star star-2" cx="350" cy="60" r="2" fill="#F3CE8F" opacity="0.4"/>
          <circle class="star star-3" cx="40" cy="200" r="1.5" fill="#F3CE8F" opacity="0.4"/>
          <circle class="star star-4" cx="370" cy="180" r="2.5" fill="#F3CE8F" opacity="0.35"/>
        </svg>

        <p class="scene-quote">
          一家人，<br>
          <strong>就是最美的风景</strong>。
        </p>
      </section>

      <!-- 右侧：注册表单 -->
      <section class="form-side">
        <div class="brand">
          <div class="brand-badge">🏡</div>
          <span class="brand-name">家 · 私享空间</span>
        </div>

        <h1>加入这个家 ✨</h1>
        <p class="subtitle">创建账号，开始记录家庭的美好时光</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          @submit.prevent="handleRegister"
        >
          <!-- 用户名 -->
          <div class="field">
            <span class="field-icon">🧸</span>
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
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
              placeholder="设置密码（至少6位）"
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

          <!-- 家庭名称 -->
          <div class="field">
            <span class="field-icon">🏠</span>
            <el-input
              v-model="form.familyName"
              placeholder="家庭名称（可选，创建新家庭）"
              size="large"
              @focus="focusField = 'familyName'"
              @blur="focusField = ''"
            />
          </div>

          <!-- 错误提示 -->
          <div v-if="errorMsg" class="error-box">{{ errorMsg }}</div>

          <!-- 注册按钮 -->
          <el-form-item style="margin-bottom: 0;">
            <button class="btn-home" type="submit" :disabled="loading">
              {{ loading ? '创建中...' : '创 建 家 庭' }}
            </button>
          </el-form-item>
        </el-form>

        <!-- 分隔线 -->
        <div class="divider">已经有家了？</div>

        <!-- 登录入口 -->
        <div class="invite-card" @click="router.push('/login')">
          <div class="invite-text">
            <b>已有账号？</b><br>
            回到温暖的家 🏡
          </div>
          <span class="invite-emoji">🌙</span>
        </div>

        <p class="footer-note">🔒 你的家庭空间安全私密 · 温柔守护每一份回忆</p>
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

const form = reactive({ username: '', password: '', familyName: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

async function handleRegister() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    errorMsg.value = ''
    try {
      await authStore.register(form)
      ElMessage.success('注册成功，欢迎回家')
    } catch (e) {
      errorMsg.value = e.response?.data?.message || '注册失败，请稍后重试'
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.warm-register {
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
  color: var(--text-primary);
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

.smoke { animation: smokeRise 4s ease-in-out infinite; }
.smoke-1 { animation-delay: 0s; }
.smoke-2 { animation-delay: 1.3s; }
.smoke-3 { animation-delay: 2.6s; }
@keyframes smokeRise {
  0% { opacity: 0; transform: translateY(0) scale(1); }
  50% { opacity: 0.3; }
  100% { opacity: 0; transform: translateY(-20px) scale(1.4); }
}

.star { animation: starTwinkle 3s ease-in-out infinite; }
.star-1 { animation-delay: 0s; }
.star-2 { animation-delay: 0.8s; }
.star-3 { animation-delay: 1.6s; }
.star-4 { animation-delay: 2.4s; }
@keyframes starTwinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.3); }
}

.scene-quote {
  margin-top: 28px;
  text-align: center;
  font-size: 15px;
  line-height: 1.9;
  color: var(--text-secondary);
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
.brand-name { font-size: 14px; letter-spacing: .12em; color: var(--text-secondary); }

h1 {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: .04em;
  margin-bottom: 6px;
}
.subtitle {
  font-size: 13px;
  color: var(--text-secondary);
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
  color: var(--text-primary);
}
.field :deep(.el-input__inner::placeholder) {
  color: var(--text-secondary);
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
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  transition: color .2s;
}
.eye-toggle:hover { color: var(--text-primary); }

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
  color: var(--text-secondary);
  font-size: 12px;
  letter-spacing: .1em;
}
.divider::before, .divider::after {
  content: ""; flex: 1; height: 1px;
  background: linear-gradient(to right, transparent, var(--wood-light), transparent);
}

/* 登录卡片 */
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
.invite-text { font-size: 12.5px; color: var(--text-secondary); line-height: 1.5; }
.invite-text b { color: var(--text-primary); font-weight: 600; }
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
  .warm-register {
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
