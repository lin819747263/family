<template>
  <div>
    <!-- 页面头部 -->
    <div class="page-head">
      <div>
        <div class="page-title">📦 物品管理</div>
        <div class="page-sub">家里的每件东西，都有属于自己的位置</div>
      </div>
      <div class="head-actions">
        <el-button class="btn-ghost" @click="showAiDialog = true">
          <span>🪄</span> AI 录入
        </el-button>
        <el-button class="btn-primary" @click="showForm = true">
          <span>＋</span> 添加物品
        </el-button>
      </div>
    </div>

    <!-- 子标签页 -->
    <div class="subtabs">
      <router-link to="/inventory" class="subtab">🗃 物品总览</router-link>
      <router-link to="/inventory/spaces" class="subtab">🏠 空间管理</router-link>
      <router-link to="/inventory/borrows" class="subtab" :class="{ active: $route.path === '/inventory/borrows' }">🤝 借物追踪</router-link>
      <router-link to="/inventory/unused" class="subtab">🍃 断舍离</router-link>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar reveal">
      <button
        class="fchip"
        :class="{ active: filterStatus === '' }"
        @click="filterStatus = ''; loadBorrows()"
      >全部</button>
      <button
        class="fchip"
        :class="{ active: filterStatus === 'borrowed' }"
        @click="filterStatus = 'borrowed'; loadBorrows()"
      >借出中</button>
      <button
        class="fchip"
        :class="{ active: filterStatus === 'returned' }"
        @click="filterStatus = 'returned'; loadBorrows()"
      >已归还</button>
      <button
        class="fchip"
        :class="{ active: filterStatus === 'overdue' }"
        @click="filterStatus = 'overdue'; loadBorrows()"
      >逾期</button>
      <el-button class="btn-primary" style="margin-left:auto;" @click="showForm = true">
        ＋ 登记借出
      </el-button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="card empty-card">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="loadError" class="card error-card">
      <el-icon :size="48" color="#f87171"><CircleCloseFilled /></el-icon>
      <p>数据加载失败，请稍后重试</p>
      <el-button class="btn-primary" style="margin-top:12px;" @click="loadBorrows">
        🔄 重新加载
      </el-button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="borrows.length === 0" class="card empty-card">
      <el-icon :size="48" color="#cbd5e1"><Share /></el-icon>
      <p>暂无借出记录</p>
    </div>

    <!-- 借物列表 -->
    <div v-else-if="borrows.length > 0" class="borrows-list">
      <div
        v-for="(borrow, idx) in borrows"
        :key="borrow.id"
        class="card borrow-card reveal"
        :style="{ animationDelay: (idx % 6) * 60 + 'ms' }"
      >
        <div class="bw-ico" :style="{ background: getBorrowColor(borrow.Item?.category) }">
          {{ getBorrowEmoji(borrow.Item?.category) }}
        </div>
        <div class="bw-body">
          <div class="bw-name">{{ borrow.Item?.name || '-' }}</div>
          <div class="bw-people">
            <span class="bw-avatar" style="background:linear-gradient(135deg,var(--terracotta),var(--terra-deep));">
              {{ (borrow.lender?.nickname || '我')[0] }}
            </span>
            {{ borrow.lender?.nickname || '我' }}
            <span class="bw-arrow">→</span>
            <span class="bw-avatar" style="background:linear-gradient(135deg,var(--sky),#6E8CA0);">
              {{ (borrow.borrower?.nickname || '?')[0] }}
            </span>
            {{ borrow.borrower?.nickname || '-' }}
          </div>
          <div class="bw-dates">
            📅 {{ borrow.borrowDate }} 借出 · 预计 {{ borrow.expectedReturnDate || '未定' }} 归还
          </div>
        </div>
        <div class="bw-right">
          <span class="bw-status" :class="getStatusClass(borrow.status)">
            {{ getStatusText(borrow.status) }}
          </span>
          <div class="bw-btns">
            <button
              v-if="borrow.status !== 'returned'"
              class="mini-btn"
              @click="handleReturn(borrow.id)"
            >确认归还</button>
            <button
              v-if="borrow.status === 'borrowed' || borrow.status === 'overdue'"
              class="mini-btn warn"
              @click="handleRemind(borrow.id)"
            >催还</button>
            <button
              v-if="borrow.status === 'returned'"
              class="mini-btn"
              disabled
              style="opacity:.5;"
            >已完成</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 登记借出弹窗 -->
    <el-dialog v-model="showForm" title="🤝 登记借出" width="420px" class="warm-dialog">
      <el-form :model="form" label-width="80px" class="warm-form">
        <el-form-item label="物品">
          <el-select v-model="form.itemId" filterable placeholder="🔍 搜索物品" style="width:100%" popper-class="warm-popper">
            <el-option v-for="i in allItems" :key="i.id" :label="i.name" :value="i.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="借用人">
          <el-select v-model="form.borrowedBy" filterable placeholder="👤 选择家庭成员" style="width:100%" popper-class="warm-popper">
            <el-option v-for="m in familyMembers" :key="m.userId || m.id" :label="m.nickname || m.User?.nickname || '成员'" :value="m.userId || m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="预计归还">
          <el-date-picker v-model="form.expectedReturnDate" type="date" value-format="YYYY-MM-DD" style="width:100%" popper-class="warm-popper" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" :rows="2" placeholder="添加备注信息..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showForm = false">取消</button>
          <button class="btn-confirm" :class="{ loading: saving }" :disabled="saving" @click="handleCreate">
            {{ saving ? '登记中...' : '🤝 确认登记' }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, onMounted, nextTick } from 'vue'
import { inventoryApi, familyApi } from '@/api'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()
const borrows = ref([])
const allItems = ref([])
const familyMembers = ref([])
const filterStatus = ref('')
const showForm = ref(false)
const saving = ref(false)
const loading = ref(false)
const loadError = ref(false)
const form = ref({ itemId: null, borrowedBy: '', expectedReturnDate: '', note: '' })

// 借物颜色映射
const borrowColorMap = {
  '电子产品': 'rgba(159,184,201,.2)',
  '户外': 'rgba(232,179,106,.2)',
  '工具': 'rgba(159,184,201,.2)',
}
const borrowEmojiMap = {
  '电子产品': '📷',
  '户外': '⛺',
  '工具': '🔧',
}
function getBorrowColor(cat) { return borrowColorMap[cat] || 'rgba(200,159,133,.15)' }
function getBorrowEmoji(cat) { return borrowEmojiMap[cat] || '📦' }

function getStatusClass(status) {
  return { borrowed: 'bs-borrowed', returned: 'bs-returned', overdue: 'bs-overdue' }[status] || 'bs-borrowed'
}
function getStatusText(status) {
  return { borrowed: '借出中', returned: '已归还', overdue: '已逾期' }[status] || '借出中'
}

function setupReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in')
        io.unobserve(entry.target)
      }
    })
  }, { threshold: 0.12 })
  document.querySelectorAll('.reveal').forEach(el => io.observe(el))
}

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadBorrows()
  const [itemsRes, membersRes] = await Promise.all([
    inventoryApi.getItems({ familyId: authStore.currentFamily?.id, pageSize: 200 }),
    familyApi.getMembers({ familyId: authStore.currentFamily?.id })
  ])
  allItems.value = itemsRes.data.list
  familyMembers.value = membersRes.data || []
  nextTick(setupReveal)
})

async function loadBorrows() {
  const familyId = authStore.currentFamily?.id
  if (!familyId) {
    console.warn('[Borrows] currentFamily 未就绪，跳过加载', authStore.currentFamily)
    return
  }
  loadError.value = false
  loading.value = true
  try {
    const params = { familyId, pageSize: 50 }
    if (filterStatus.value) params.status = filterStatus.value
    const res = await inventoryApi.getBorrows(params)
    borrows.value = res.data.list
    nextTick(setupReveal)
  } catch (e) {
    console.error('[Borrows] 加载失败', e)
    loadError.value = true
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!form.value.itemId || !form.value.borrowedBy) return ElMessage.warning('请填写完整信息')
  saving.value = true
  try {
    await inventoryApi.createBorrow({ ...form.value, familyId: authStore.currentFamily?.id })
    ElMessage.success('登记成功')
    showForm.value = false
    form.value = { itemId: null, borrowedBy: '', expectedReturnDate: '', note: '' }
    loadBorrows()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

async function handleReturn(id) {
  await inventoryApi.returnBorrow(id)
  ElMessage.success('已确认归还')
  loadBorrows()
}

async function handleRemind(id) {
  await inventoryApi.remindBorrow(id)
  ElMessage.success('催还通知已发送')
}
</script>

<style scoped>
/* ===== 页面头部 ===== */
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.page-sub {
  margin-top: 6px;
  font-size: 13.5px;
  color: var(--text-secondary);
}
.head-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* ===== 按钮 ===== */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 18px;
  border-radius: 13px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--terracotta), #D3A98B);
  color: #FFF9F2;
  box-shadow: 0 8px 20px rgba(200,159,133,.4);
  transition: transform .3s, box-shadow .3s;
}
.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 26px rgba(200,159,133,.3);
}
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 18px;
  border-radius: 13px;
  border: 1.5px solid var(--border);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  background: rgba(255,253,250,.85);
  color: var(--terra-deep);
  transition: transform .3s, box-shadow .3s;
}
.btn-ghost:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 26px rgba(200,159,133,.15);
}

/* ===== 子标签页 ===== */
.subtabs {
  display: flex;
  gap: 6px;
  background: rgba(243,234,221,.6);
  border: 1px solid var(--border);
  padding: 5px;
  border-radius: 16px;
  margin-bottom: 22px;
  overflow-x: auto;
}
.subtab {
  padding: 10px 18px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all .3s;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 7px;
}
.subtab:hover { color: var(--terra-deep); }
.subtab.active,
.subtab.router-link-exact-active {
  background: var(--bg-card);
  color: var(--terra-deep);
  box-shadow: 0 4px 14px rgba(160,120,90,.14);
}

/* ===== 筛选栏 ===== */
.filter-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 18px;
  align-items: center;
}
.fchip {
  padding: 10px 15px;
  border-radius: 12px;
  border: 1.5px solid var(--border);
  background: rgba(255,253,250,.8);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all .25s;
}
.fchip:hover {
  border-color: var(--terracotta);
  color: var(--terra-deep);
}
.fchip.active {
  background: var(--terracotta);
  border-color: var(--terracotta);
  color: #fff;
}

/* ===== 空状态 ===== */
.empty-card {
  text-align: center;
  padding: 60px 20px;
}
.empty-card p {
  margin-top: 12px;
  color: var(--text-secondary);
}

/* ===== 加载/错误状态 ===== */
.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--terracotta);
  border-radius: 50%;
  animation: spin .8s linear infinite;
  margin: 0 auto;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.error-card {
  text-align: center;
  padding: 60px 20px;
}
.error-card p {
  margin-top: 12px;
  color: var(--text-secondary);
}

/* ===== 借物列表 ===== */
.borrows-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.borrow-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  transition: transform .3s, box-shadow .3s;
}
.borrow-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 32px rgba(160,120,90,.14);
}
.bw-ico {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
  flex-shrink: 0;
}
.bw-body {
  flex: 1;
  min-width: 0;
}
.bw-name {
  font-size: 15px;
  font-weight: 700;
}
.bw-people {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--text-secondary);
  flex-wrap: wrap;
}
.bw-avatar {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.bw-arrow {
  color: var(--terracotta);
}
.bw-dates {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 5px;
}
.bw-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}
.bw-status {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 999px;
}
.bs-borrowed {
  background: rgba(232,179,106,.2);
  color: #C08A3E;
}
.bs-overdue {
  background: rgba(217,154,154,.2);
  color: #B06A6A;
  animation: pulse-soft 2s infinite;
}
.bs-returned {
  background: rgba(168,176,138,.2);
  color: #7E8862;
}
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: .55; }
}
.bw-btns {
  display: flex;
  gap: 6px;
}
.mini-btn {
  padding: 6px 12px;
  border-radius: 9px;
  border: 1.5px solid var(--border);
  background: rgba(255,253,250,.8);
  color: var(--terra-deep);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .25s;
}
.mini-btn:hover {
  border-color: var(--terracotta);
  background: var(--terracotta);
  color: #fff;
}
.mini-btn.warn:hover {
  border-color: var(--amber);
  background: var(--amber);
}

/* ===== 暖色弹窗 ===== */
:deep(.warm-dialog .el-dialog) {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(160,120,90,.18);
  overflow: visible;
}
:deep(.warm-dialog .el-overlay) {
  overflow: visible;
}
:deep(.warm-dialog .el-dialog__header) {
  padding: 20px 24px 0;
  margin: 0;
}
:deep(.warm-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 700;
  color: var(--terra-deep);
}
:deep(.warm-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: var(--text-secondary);
  font-size: 18px;
}
:deep(.warm-dialog .el-dialog__body) {
  padding: 16px 24px 8px;
}
:deep(.warm-dialog .el-dialog__footer) {
  padding: 8px 24px 20px;
}
:deep(.warm-form .el-form-item__label) {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 13px;
}
:deep(.warm-form .el-input__wrapper) {
  background: #FFFDF9;
  border: 1.5px solid var(--wood-light);
  border-radius: 12px;
  box-shadow: none;
  transition: border-color .3s, box-shadow .3s;
}
:deep(.warm-form .el-input__wrapper:hover) {
  border-color: var(--terracotta);
}
:deep(.warm-form .el-input__wrapper.is-focus) {
  border-color: var(--terracotta);
  box-shadow: 0 0 0 3px rgba(200,159,133,.12);
}
:deep(.warm-form .el-textarea__inner) {
  background: #FFFDF9;
  border: 1.5px solid var(--wood-light);
  border-radius: 12px;
  box-shadow: none;
  transition: border-color .3s, box-shadow .3s;
}
:deep(.warm-form .el-textarea__inner:focus) {
  border-color: var(--terracotta);
  box-shadow: 0 0 0 3px rgba(200,159,133,.12);
}
:deep(.warm-form .el-select .el-input__wrapper) {
  background: #FFFDF9;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.btn-cancel {
  padding: 10px 20px;
  border-radius: 12px;
  border: 1.5px solid var(--border);
  background: rgba(255,253,250,.85);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all .25s;
  font-family: inherit;
}
.btn-cancel:hover {
  border-color: var(--terracotta);
  color: var(--terra-deep);
}
.btn-confirm {
  padding: 10px 24px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, var(--terracotta), #D3A98B);
  color: #FFF9F2;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(200,159,133,.35);
  transition: all .25s;
  font-family: inherit;
}
.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(200,159,133,.4);
}
.btn-confirm.loading {
  opacity: .7;
  cursor: not-allowed;
  transform: none;
}

/* ===== 响应式 ===== */
@media (max-width: 600px) {
  .page-head {
    gap: 12px;
  }
  .page-title {
    font-size: 22px;
  }
  .subtabs {
    gap: 4px;
    padding: 4px;
  }
  .subtab {
    padding: 8px 12px;
    font-size: 13px;
  }
  .borrow-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .bw-right {
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
    align-items: center;
  }
  .filter-bar {
    gap: 6px;
  }
  .fchip {
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style>

<!-- 全局：暖色下拉框 -->
<style>
/* ===== 强制弹窗不裁剪 ===== */
.warm-dialog .el-dialog {
  overflow: visible !important;
}
.warm-dialog .el-dialog__body {
  overflow: visible !important;
}

/* ===== 所有暖色 popper 提到弹窗之上 ===== */
.warm-popper,
.warm-popper.el-popper,
.warm-popper.el-select__popper,
.warm-popper.el-picker-panel {
  z-index: 32000 !important;
}

/* ===== 下拉面板基础 ===== */
.warm-popper {
  background: #FFFDFA !important;
  border: 1.5px solid #E2CDB2 !important;
  border-radius: 14px !important;
  box-shadow: 0 12px 36px rgba(160,120,90,.18) !important;
}
.warm-popper .el-popper__arrow::before {
  background: #FFFDFA !important;
  border-color: #E2CDB2 !important;
}

/* ===== 选项样式 ===== */
.warm-popper .el-select-dropdown__item {
  color: #6B5744;
  font-size: 13.5px;
  border-radius: 8px;
  margin: 2px 6px;
  padding: 8px 12px;
  height: auto;
  line-height: 1.5;
}
.warm-popper .el-select-dropdown__item.hover,
.warm-popper .el-select-dropdown__item:hover {
  background: #F3EADD !important;
  color: #96684A !important;
}
.warm-popper .el-select-dropdown__item.is-selected {
  color: #96684A !important;
  font-weight: 700;
  background: rgba(200,159,133,.12) !important;
}
.warm-popper .el-select-dropdown__empty {
  color: #A08D7A;
  padding: 20px;
}
.warm-popper .el-select-dropdown__wrap {
  max-height: 260px;
}

/* ===== 日期选择器 ===== */
.warm-popper .el-picker-panel__body {
  background: #FFFDFA;
}
.warm-popper .el-date-table td.today .el-date-table-cell__text {
  color: #C89F85;
}
.warm-popper .el-date-table td.current .el-date-table-cell__text {
  background: linear-gradient(135deg, #C89F85, #D3A98B);
  color: #fff;
  border-radius: 8px;
}
.warm-popper .el-date-table td.available:hover .el-date-table-cell__text {
  background: #F3EADD;
  border-radius: 8px;
}
.warm-popper .el-picker-panel__footer {
  background: #FFFDFA;
  border-top: 1px solid #E2CDB2;
}
.warm-popper .el-picker-panel__sidebar {
  background: #FFFDFA;
  border-right: 1px solid #E2CDB2;
}
.warm-popper .el-picker-panel__shortcut {
  color: #A08D7A;
  font-size: 12.5px;
}
.warm-popper .el-picker-panel__shortcut:hover {
  color: #96684A;
}
.warm-popper .el-picker-panel__icon-btn {
  color: #A08D7A;
}
.warm-popper .el-picker-panel__icon-btn:hover {
  color: #96684A;
}
.warm-popper .el-date-picker__header-label {
  color: #6B5744;
  font-weight: 600;
}
.warm-popper .el-date-picker__header-label:hover {
  color: #96684A;
}
</style>
