<template>
  <div class="admin-page">
    <div class="page-header">
      <div>
        <div class="page-title">后台管理</div>
        <p class="page-desc">系统用户管理与数据概览</p>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" style="margin-bottom:24px;">
      <el-col :xs="12" :sm="6" v-for="s in statCards" :key="s.label">
        <div class="card stat-card">
          <div class="stat-icon" :style="{ background: s.bg }">
            <el-icon :size="20"><component :is="s.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 用户管理 -->
    <div class="card" style="padding:0;">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">用户列表</span>
          <el-tag type="info" effect="plain" size="small">{{ total }} 人</el-tag>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="search"
            placeholder="搜索用户名/昵称"
            :prefix-icon="Search"
            style="width:200px;"
            clearable
            @keyup.enter="loadUsers"
            @clear="loadUsers"
          />
          <el-select v-model="filterRole" placeholder="角色" clearable style="width:100px;" @change="loadUsers">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="member" />
          </el-select>
          <el-select v-model="filterStatus" placeholder="状态" clearable style="width:100px;" @change="loadUsers">
            <el-option label="正常" value="active" />
            <el-option label="已禁用" value="disabled" />
          </el-select>
        </div>
      </div>

      <div class="table-wrap">
      <el-table :data="users" stripe v-loading="loading">
        <el-table-column label="用户" min-width="180">
          <template #default="{ row }">
            <div style="display:flex;align-items:center;gap:10px;">
              <el-avatar :size="36" :src="row.avatar" class="user-avatar">
                {{ (row.nickname || row.username)[0] }}
              </el-avatar>
              <div>
                <div style="font-weight:600;font-size:14px;">{{ row.nickname || row.username }}</div>
                <div style="font-size:12px;color:#94a3b8;">{{ row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small" effect="light">
              {{ row.role === 'admin' ? '管理员' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'warning'" size="small" effect="light">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.email || '-' }}</template>
        </el-table-column>
        <el-table-column prop="phone" label="手机" width="120">
          <template #default="{ row }">{{ row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column label="注册时间" width="110">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openResetPwd(row)">重置密码</el-button>
            <el-button
              v-if="row.id !== currentUserId"
              text
              :type="row.status === 'active' ? 'warning' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>

      <div v-if="total > pageSize" style="text-align:center;padding:16px;">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadUsers"
        />
      </div>
    </div>

    <!-- 系统设置 -->
    <div class="card settings-card" style="margin-top:24px;">
      <div class="settings-header">
        <span class="settings-title">⚙️ 系统设置</span>
      </div>
      <el-form :model="settings" label-width="120px" label-position="left" class="settings-form">
        <el-divider content-position="left">AI 小助手配置</el-divider>
        <el-form-item label="DeepSeek API Key">
          <el-input v-model="settings.ai_api_key" type="password" show-password placeholder="sk-..." style="max-width:400px;" />
        </el-form-item>
        <el-form-item label="API 地址">
          <el-input v-model="settings.ai_base_url" placeholder="https://api.deepseek.com" style="max-width:400px;" />
          <div class="form-tip">DeepSeek 或其他兼容 OpenAI 的接口地址</div>
        </el-form-item>
        <el-form-item label="模型名称">
          <el-input v-model="settings.ai_model" placeholder="deepseek-chat" style="max-width:400px;" />
        </el-form-item>
        <el-form-item label="系统提示词">
          <el-input v-model="settings.ai_system_prompt" type="textarea" :rows="3" placeholder="AI 助手的角色设定" style="max-width:500px;" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="savingSettings" @click="handleSaveSettings">保存设置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="showResetPwd" title="重置密码" width="400px" destroy-on-close class="warm-dialog">
      <div style="margin-bottom:16px;">
        <span style="color:var(--text-secondary);">为用户 </span>
        <span style="font-weight:600;">{{ resetTarget?.nickname || resetTarget?.username }}</span>
        <span style="color:var(--text-secondary);"> 重置密码</span>
      </div>
      <el-form :model="pwdForm" label-width="80px" class="warm-form">
        <el-form-item label="新密码">
          <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="至少6位" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再次输入密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResetPwd = false">取消</el-button>
        <el-button type="primary" :loading="resetting" @click="handleResetPwd">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, User, UserFilled, House, Coin } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.id)

onMounted(async () => {
  // 确保用户信息已加载
  if (!authStore.user && authStore.isLoggedIn) {
    await authStore.getProfile()
  }
  // 非管理员跳转
  if (authStore.user?.role !== 'admin') {
    ElMessage.error('需要管理员权限')
    router.push('/')
    return
  }
  await Promise.all([loadStats(), loadUsers(), loadSettings()])
})

const users = ref([])
const loading = ref(false)
const search = ref('')
const filterRole = ref('')
const filterStatus = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const stats = reactive({ totalUsers: 0, activeUsers: 0, disabledUsers: 0, adminUsers: 0, totalFamilies: 0, totalMembers: 0 })

const showResetPwd = ref(false)
const resetTarget = ref(null)
const resetting = ref(false)
const pwdForm = reactive({ newPassword: '', confirmPassword: '' })

// 系统设置
const settings = reactive({ ai_api_key: '', ai_base_url: '', ai_model: '', ai_system_prompt: '' })
const savingSettings = ref(false)

const statCards = computed(() => [
  { label: '总用户', value: stats.totalUsers, icon: 'User', bg: 'linear-gradient(135deg, var(--terracotta), var(--terracotta-d))' },
  { label: '活跃用户', value: stats.activeUsers, icon: 'UserFilled', bg: 'linear-gradient(135deg, var(--sage), var(--sage-d))' },
  { label: '已禁用', value: stats.disabledUsers, icon: 'User', bg: 'linear-gradient(135deg, var(--rose), var(--rose-d))' },
  { label: '家庭数', value: stats.totalFamilies, icon: 'House', bg: 'linear-gradient(135deg, var(--amber), var(--amber-d))' }
])

function formatDate(d) {
  return d ? dayjs(d).format('YYYY-MM-DD') : '-'
}

async function loadStats() {
  try {
    const res = await adminApi.getStats()
    Object.assign(stats, res.data)
  } catch (e) { console.error(e) }
}

async function loadUsers() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (search.value) params.search = search.value
    if (filterRole.value) params.role = filterRole.value
    if (filterStatus.value) params.status = filterStatus.value
    const res = await adminApi.getUsers(params)
    users.value = res.data.list
    total.value = res.data.total
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function openResetPwd(user) {
  resetTarget.value = user
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
  showResetPwd.value = true
}

async function handleResetPwd() {
  if (!pwdForm.newPassword || pwdForm.newPassword.length < 6) {
    return ElMessage.warning('密码长度不能少于6位')
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    return ElMessage.warning('两次输入的密码不一致')
  }
  resetting.value = true
  try {
    await adminApi.resetPassword(resetTarget.value.id, { newPassword: pwdForm.newPassword })
    ElMessage.success('密码重置成功')
    showResetPwd.value = false
  } catch (e) { console.error(e) }
  finally { resetting.value = false }
}

async function handleToggleStatus(user) {
  const newStatus = user.status === 'active' ? 'disabled' : 'active'
  const action = newStatus === 'disabled' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定${action}用户 "${user.nickname || user.username}" ？`, '确认操作', { type: 'warning' })
    await adminApi.updateUserStatus(user.id, { status: newStatus })
    ElMessage.success(`已${action}`)
    user.status = newStatus
    loadStats()
  } catch { /* cancel */ }
}

async function loadSettings() {
  try {
    const res = await adminApi.getSettings()
    Object.assign(settings, res.data || {})
  } catch (e) { console.error(e) }
}

async function handleSaveSettings() {
  savingSettings.value = true
  try {
    // 不发送掩码后的 key
    const toSave = { ...settings }
    if (toSave.ai_api_key && toSave.ai_api_key.startsWith('sk-...')) {
      delete toSave.ai_api_key
    }
    await adminApi.updateSettings(toSave)
    ElMessage.success('设置已保存')
  } catch (e) { console.error(e) }
  finally { savingSettings.value = false }
}
</script>

<style scoped>
.admin-page {
  animation: pageIn 0.4s ease-out;
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  margin-bottom: 20px;
}
.page-desc {
  font-size: 14px;
  color: #A08D7A;
  margin-top: 4px;
}

/* 统计卡片 */
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  margin-bottom: 16px;
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #6B5744;
}
.stat-label {
  font-size: 13px;
  color: #A08D7A;
  margin-top: 2px;
}

/* 表格工具栏 */
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #F3EADD;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toolbar-title {
  font-size: 16px;
  font-weight: 600;
  color: #6B5744;
}
.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 用户头像 */
.user-avatar {
  background: linear-gradient(135deg, var(--terracotta), #D3A98B);
  color: #fff;
  font-weight: 600;
}

@media (max-width: 768px) {
  .table-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  .toolbar-right {
    width: 100%;
    flex-wrap: wrap;
  }
}

/* 系统设置 */
.settings-card {
  padding: 24px;
}
.settings-header {
  margin-bottom: 20px;
}
.settings-title {
  font-size: 18px;
  font-weight: 700;
  color: #6B5744;
}
.settings-form {
  max-width: 600px;
}
.form-tip {
  font-size: 12px;
  color: #A08D7A;
  margin-top: 4px;
}
</style>
