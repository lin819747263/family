<template>
  <div class="family-page">
    <div class="page-header">
      <div>
        <div class="page-title">家庭管理</div>
        <p class="page-desc">管理家庭成员和共享数据</p>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="card" style="text-align:center;padding:40px;">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
    </div>

    <!-- 家庭信息卡片 -->
    <div v-else class="card family-info-card">
      <div class="fi-top">
        <div class="fi-icon">
          <el-icon :size="32"><House /></el-icon>
        </div>
        <div class="fi-detail">
          <div class="fi-name">{{ familyInfo.name || '我的家庭' }}</div>
          <div class="fi-desc">{{ familyInfo.description || '暂无描述' }}</div>
        </div>
        <el-button text type="primary" @click="showEditInfo = true"><el-icon><Edit /></el-icon>编辑</el-button>
      </div>
      <div class="fi-invite">
        <span class="fi-invite-label">邀请码</span>
        <span class="fi-invite-code">{{ familyInfo.inviteCode }}</span>
        <el-button size="small" @click="copyInviteCode">复制</el-button>
        <el-button size="small" text type="primary" @click="handleRegenerateCode">重新生成</el-button>
      </div>
      <div class="fi-tip">分享邀请码给家人，即可加入家庭共享数据</div>
    </div>

    <!-- 成员列表 -->
    <div class="section-title" style="margin:24px 0 16px;">
      <span style="font-size:18px;font-weight:700;color:#1e293b;">家庭成员</span>
      <el-tag type="info" effect="plain" size="small">{{ members.length }} 人</el-tag>
    </div>

    <div class="member-list">
      <div v-for="m in members" :key="m.id" class="card member-card">
        <div class="mc-left">
          <el-avatar :size="44" :src="m.User?.avatar" class="mc-avatar">
            {{ (m.User?.nickname || m.User?.username || '?')[0] }}
          </el-avatar>
          <div class="mc-info">
            <div class="mc-name">
              {{ m.User?.nickname || m.User?.username }}
              <el-tag v-if="m.role === 'owner'" size="small" type="warning" effect="light" round>创建者</el-tag>
              <el-tag v-else-if="m.role === 'admin'" size="small" type="primary" effect="light" round>管理员</el-tag>
            </div>
            <div class="mc-meta">
              <span v-if="m.User?.phone">{{ m.User.phone }}</span>
              <span>加入于 {{ formatDate(m.joinedAt) }}</span>
            </div>
          </div>
        </div>
        <div class="mc-actions">
          <template v-if="isOwner && m.userId !== authStore.user?.id">
            <el-select
              :model-value="m.role"
              size="small"
              style="width:100px;"
              @change="(val) => handleRoleChange(m.id, val)"
            >
              <el-option label="管理员" value="admin" />
              <el-option label="成员" value="member" />
            </el-select>
            <el-popconfirm title="确定移除此成员？" @confirm="handleRemove(m.id)">
              <template #reference>
                <el-button size="small" type="danger" text>移除</el-button>
              </template>
            </el-popconfirm>
          </template>
          <template v-if="m.userId === authStore.user?.id && m.role !== 'owner'">
            <el-popconfirm title="确定退出此家庭？退出后将无法访问家庭共享数据。" @confirm="handleLeave">
              <template #reference>
                <el-button size="small" type="warning" text>退出家庭</el-button>
              </template>
            </el-popconfirm>
          </template>
        </div>
      </div>
    </div>

    <!-- 编辑家庭信息弹窗 -->
    <el-dialog v-model="showEditInfo" title="编辑家庭信息" width="420px" destroy-on-close>
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="家庭名称">
          <el-input v-model="editForm.name" placeholder="输入家庭名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="家庭简介（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditInfo = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateInfo">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, reactive, computed, onMounted } from 'vue'
import { familyApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const familyInfo = ref({})
const members = ref([])
const loading = ref(false)
const showEditInfo = ref(false)
const editForm = reactive({ name: '', description: '' })

const isOwner = computed(() => {
  const me = members.value.find(m => m.userId === authStore.user?.id)
  return me?.role === 'owner'
})

function formatDate(d) {
  return d ? dayjs(d).format('YYYY-MM-DD') : '-'
}

onMounted(async () => {
  if (!await useFamilyGuard()) return
  await loadData()
})

async function loadData() {
  const familyId = authStore.currentFamily?.id
  if (!familyId) return
  loading.value = true
  try {
    const [infoRes, membersRes] = await Promise.all([
      familyApi.getInfo({ familyId }),
      familyApi.getMembers({ familyId })
    ])
    familyInfo.value = infoRes.data
    members.value = membersRes.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function copyInviteCode() {
  const code = familyInfo.value.inviteCode
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code)
  } else {
    const input = document.createElement('input')
    input.value = code
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
  }
  ElMessage.success('邀请码已复制')
}

async function handleRegenerateCode() {
  const familyId = authStore.currentFamily?.id
  if (!familyId) return
  const res = await familyApi.regenerateInviteCode({ familyId })
  familyInfo.value.inviteCode = res.data.inviteCode
  ElMessage.success('邀请码已更新')
}

async function handleUpdateInfo() {
  if (!editForm.name) return ElMessage.warning('请输入家庭名称')
  await familyApi.updateInfo({
    familyId: authStore.currentFamily?.id,
    name: editForm.name,
    description: editForm.description
  })
  ElMessage.success('更新成功')
  showEditInfo.value = false
  loadData()
}

async function handleRoleChange(memberId, role) {
  await familyApi.updateMemberRole(memberId, {
    role,
    familyId: authStore.currentFamily?.id
  })
  ElMessage.success('角色更新成功')
  loadData()
}

async function handleRemove(memberId) {
  await familyApi.removeMember(memberId, { familyId: authStore.currentFamily?.id })
  ElMessage.success('成员已移除')
  loadData()
}

async function handleLeave() {
  await familyApi.leaveFamily({ familyId: authStore.currentFamily?.id })
  ElMessage.success('已退出家庭')
  authStore.currentFamily = null
  await authStore.getProfile()
}
</script>

<style scoped>
.family-page {
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

/* 家庭信息卡片 */
.family-info-card {
  padding: 24px;
}
.fi-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.fi-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.fi-detail {
  flex: 1;
  min-width: 0;
}
.fi-name {
  font-size: 20px;
  font-weight: 700;
  color: #6B5744;
}
.fi-desc {
  font-size: 14px;
  color: #A08D7A;
  margin-top: 4px;
}

.fi-invite {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.04), rgba(118, 75, 162, 0.04));
  border: 1px solid rgba(102, 126, 234, 0.15);
  border-radius: 12px;
  margin-bottom: 12px;
}
.fi-invite-label {
  font-size: 13px;
  color: #A08D7A;
  font-weight: 500;
}
.fi-invite-code {
  font-size: 20px;
  font-weight: 700;
  color: #667eea;
  letter-spacing: 2px;
  font-family: 'Courier New', monospace;
}
.fi-tip {
  font-size: 13px;
  color: #A08D7A;
}

/* 成员列表 */
.member-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.member-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}
.mc-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.mc-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-weight: 600;
  font-size: 16px;
}
.mc-name {
  font-size: 15px;
  font-weight: 600;
  color: #6B5744;
  display: flex;
  align-items: center;
  gap: 8px;
}
.mc-meta {
  font-size: 13px;
  color: #A08D7A;
  margin-top: 4px;
  display: flex;
  gap: 12px;
}
.mc-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .fi-top {
    flex-wrap: wrap;
  }
  .fi-invite {
    flex-wrap: wrap;
    gap: 8px;
  }
  .fi-invite-code {
    font-size: 16px;
  }
  .member-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .mc-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  .mc-meta {
    flex-direction: column;
    gap: 2px;
  }
}
</style>
