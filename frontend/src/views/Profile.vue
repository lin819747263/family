<template>
  <div>
    <div class="page-title">个人中心</div>

    <el-row :gutter="16">
      <el-col :xs="24" :sm="8" style="margin-bottom:16px;">
        <div class="card" style="text-align:center;padding:32px;">
          <div style="position:relative;display:inline-block;margin-bottom:12px;">
            <el-avatar :size="72" :src="authStore.user?.avatar">{{ authStore.nickname[0] }}</el-avatar>
            <el-upload :http-request="uploadAvatar" :show-file-list="false" accept="image/*" style="position:absolute;bottom:0;right:-4px;">
              <el-button size="small" circle style="box-shadow:0 2px 8px rgba(0,0,0,0.15);">
                <el-icon :size="12"><Camera /></el-icon>
              </el-button>
            </el-upload>
          </div>
          <div style="font-size:18px;font-weight:600;">{{ authStore.nickname }}</div>
          <div style="color:#999;font-size:13px;margin-top:4px;">{{ authStore.user?.email || '未设置邮箱' }}</div>
          <div style="margin-top:16px;">
            <el-tag v-for="f in authStore.families" :key="f.id" style="margin:4px;">{{ f.name }}</el-tag>
          </div>
        </div>

        <div class="card" style="margin-top:16px;">
          <div style="font-weight:600;margin-bottom:12px;">家庭管理</div>
          <div v-for="f in authStore.families" :key="f.id" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;">
            <span>{{ f.name }}</span>
            <el-tag size="small">{{ f.FamilyMember?.role === 'owner' ? '创建者' : '成员' }}</el-tag>
          </div>
          <div style="margin-top:12px;">
            <el-input v-model="inviteCode" placeholder="输入邀请码加入家庭" style="margin-bottom:8px;">
              <template #append><el-button @click="joinFamily">加入</el-button></template>
            </el-input>
            <el-input v-model="newFamilyName" placeholder="创建新家庭">
              <template #append><el-button @click="createFamily">创建</el-button></template>
            </el-input>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="16" style="margin-bottom:16px;">
        <div class="card">
          <el-tabs v-model="tab">
            <el-tab-pane label="编辑资料" name="info">
              <el-form :model="profileForm" label-width="80px">
                <el-form-item label="昵称"><el-input v-model="profileForm.nickname" /></el-form-item>
                <el-form-item label="邮箱"><el-input v-model="profileForm.email" /></el-form-item>
                <el-form-item label="手机号"><el-input v-model="profileForm.phone" /></el-form-item>
                <el-form-item label="主题">
                  <el-radio-group v-model="profileForm.theme">
                    <el-radio value="light">浅色模式</el-radio>
                    <el-radio value="dark">深色模式</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="updateProfile">保存修改</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            <el-tab-pane label="修改密码" name="password">
              <el-form :model="pwdForm" label-width="100px">
                <el-form-item label="原密码"><el-input v-model="pwdForm.oldPassword" type="password" show-password /></el-form-item>
                <el-form-item label="新密码"><el-input v-model="pwdForm.newPassword" type="password" show-password /></el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="changePassword">修改密码</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </div>

        <div class="card" style="margin-top:16px;">
          <div style="font-weight:600;margin-bottom:12px;">存储空间</div>
          <div v-if="storageInfo" style="display:flex;align-items:center;gap:12px;">
            <el-progress type="dashboard" :percentage="storageInfo.percent || 0" :width="100" />
            <div>
              <div>已使用 {{ formatBytes(storageInfo.totalUsed) }} / {{ formatBytes(storageInfo.totalLimit) }}</div>
              <div v-if="storageInfo.members?.length" style="font-size:13px;color:#999;margin-top:4px;">
                <div v-for="m in storageInfo.members" :key="m.userId" style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
                  <span>{{ m.nickname || '成员' }}</span>
                  <span>{{ formatBytes(m.used) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-button style="margin-top:16px;" type="danger" plain @click="authStore.logout()">退出登录</el-button>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, reactive, onMounted, watch } from 'vue'
import { useAuthStore } from '@/store/auth'
import { authApi, albumApi } from '@/api'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const tab = ref('info')
const inviteCode = ref('')
const newFamilyName = ref('')
const storageInfo = ref(null)

const profileForm = reactive({
  nickname: authStore.user?.nickname || '',
  email: authStore.user?.email || '',
  phone: authStore.user?.phone || '',
  theme: authStore.user?.theme || 'light'
})

// 同步 authStore.user 到表单（异步加载完成后）
watch(() => authStore.user, (user) => {
  if (user) {
    profileForm.nickname = user.nickname || ''
    profileForm.email = user.email || ''
    profileForm.phone = user.phone || ''
    profileForm.theme = user.theme || 'light'
  }
}, { immediate: true })

const pwdForm = reactive({ oldPassword: '', newPassword: '' })

onMounted(async () => {
  if (!await useFamilyGuard()) return
  try {
    const res = await albumApi.getStorage({ familyId: authStore.currentFamily.id })
    storageInfo.value = res.data
  } catch (e) { console.error(e) }
})

async function updateProfile() {
  await authApi.updateProfile(profileForm)
  ElMessage.success('保存成功')
  await authStore.getProfile()
}

async function changePassword() {
  if (!pwdForm.oldPassword || !pwdForm.newPassword) return ElMessage.warning('请填写完整')
  await authApi.changePassword(pwdForm)
  ElMessage.success('密码修改成功')
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
}

async function joinFamily() {
  if (!inviteCode.value) return ElMessage.warning('请输入邀请码')
  await authApi.joinFamily({ inviteCode: inviteCode.value })
  ElMessage.success('加入成功')
  inviteCode.value = ''
  await authStore.getProfile()
}

async function createFamily() {
  if (!newFamilyName.value) return ElMessage.warning('请输入家庭名称')
  await authApi.createFamily({ name: newFamilyName.value })
  ElMessage.success('创建成功')
  newFamilyName.value = ''
  await authStore.getProfile()
}

async function uploadAvatar({ file }) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await albumApi.uploadPhoto(formData)
    await authApi.updateProfile({ avatar: res.data.url })
    await authStore.getProfile()
    ElMessage.success('头像已更新')
  } catch (e) { ElMessage.error('上传失败') }
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = parseInt(bytes)
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(1)} ${units[i]}`
}
</script>
