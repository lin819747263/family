<template>
  <div class="books-page">
    <div class="page-header">
      <div class="page-title">账本管理</div>
      <el-button type="primary" @click="showCreate = true">
        <el-icon><Plus /></el-icon>新建账本
      </el-button>
    </div>

    <div class="books-grid">
      <div
        v-for="b in books"
        :key="b.id"
        class="book-card card"
        @click="selectBook(b)"
      >
        <div class="book-top">
          <div class="book-icon" :class="b.type">
            <el-icon :size="28"><Coin /></el-icon>
          </div>
          <el-dropdown trigger="click" @command="(cmd) => handleBookCmd(cmd, b)" @click.stop>
            <button class="book-more" @click.stop>
              <el-icon><MoreFilled /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="delete">
                  <el-icon color="#f87171"><Delete /></el-icon>
                  <span style="color:#f87171;">删除账本</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="book-name">{{ b.name }}</div>
        <div class="book-desc">{{ b.description || '暂无描述' }}</div>
        <div class="book-footer">
          <el-tag
            size="small"
            :type="b.type === 'family' ? 'primary' : 'success'"
            effect="light"
            round
          >
            {{ b.type === 'family' ? '家庭共享' : '个人私密' }}
          </el-tag>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="books.length === 0" class="empty-card card">
        <el-icon :size="48" color="#cbd5e1"><Coin /></el-icon>
        <p>还没有账本，点击右上角创建一个吧</p>
      </div>
    </div>

    <!-- 新建账本弹窗 -->
    <el-dialog v-model="showCreate" title="新建账本" width="440px" class="form-dialog">
      <el-form :model="form" label-width="80px">
        <el-form-item label="账本名称">
          <el-input v-model="form.name" placeholder="如：家庭生活、旅行基金" />
        </el-form-item>
        <el-form-item label="账本类型">
          <el-radio-group v-model="form.type">
            <el-radio value="family">家庭共享</el-radio>
            <el-radio value="personal">个人私密</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <el-dialog
      v-model="showDelete"
      title="删除账本"
      width="440px"
      class="form-dialog"
      :close-on-click-modal="false"
    >
      <div class="delete-warn">
        <div class="warn-icon">
          <el-icon :size="28" color="#f87171"><WarningFilled /></el-icon>
        </div>
        <div class="warn-body">
          <div class="warn-title">确定要删除账本「{{ deleteTarget?.name }}」吗？</div>
          <div v-if="deleteTxnCount > 0" class="warn-detail">
            该账本下有 <strong>{{ deleteTxnCount }}</strong> 笔交易记录，删除后将<strong>同时清除所有交易、预算和周期性账单</strong>，此操作不可撤销。
          </div>
          <div v-else class="warn-detail">
            删除后将同时清除关联的预算和周期性账单，此操作不可撤销。
          </div>
        </div>
      </div>
      <el-checkbox v-if="deleteTxnCount > 0" v-model="confirmForce" class="force-check">
        我已了解风险，确认删除所有数据
      </el-checkbox>
      <template #footer>
        <el-button @click="showDelete = false">取消</el-button>
        <el-button
          type="danger"
          :loading="deleting"
          :disabled="deleteTxnCount > 0 && !confirmForce"
          @click="confirmDelete"
        >
          确认删除
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { accountingApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { useAccountingStore } from '@/store/accounting'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const accountingStore = useAccountingStore()
const books = ref([])
const showCreate = ref(false)
const saving = ref(false)
const form = ref({ name: '', type: 'family', description: '' })

// 删除相关
const showDelete = ref(false)
const deleteTarget = ref(null)
const deleteTxnCount = ref(0)
const confirmForce = ref(false)
const deleting = ref(false)

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadBooks()
})

async function loadBooks() {
  const res = await accountingApi.getBooks({ familyId: authStore.currentFamily?.id })
  books.value = res.data
  accountingStore.books = res.data
}

function selectBook(book) {
  accountingStore.setCurrentBookId(book.id)
  router.push('/accounting')
}

function handleBookCmd(cmd, book) {
  if (cmd === 'delete') openDelete(book)
}

async function openDelete(book) {
  deleteTarget.value = book
  confirmForce.value = false
  deleting.value = false
  // 先尝试不带 force 删除，获取交易数量
  try {
    await accountingApi.deleteBook(book.id, false, true)
    // 没有交易，直接删除成功
    ElMessage.success('账本已删除')
    loadBooks()
  } catch (err) {
    const data = err.response?.data
    if (data?.data?.txnCount) {
      // 有交易，弹窗确认
      deleteTxnCount.value = data.data.txnCount
      showDelete.value = true
    } else {
      ElMessage.error(data?.message || '删除失败')
    }
  }
}

async function confirmDelete() {
  deleting.value = true
  try {
    await accountingApi.deleteBook(deleteTarget.value.id, true)
    ElMessage.success('账本已删除')
    showDelete.value = false
    loadBooks()
  } catch {
    ElMessage.error('删除失败')
  } finally {
    deleting.value = false
  }
}

async function handleCreate() {
  if (!form.value.name) return ElMessage.warning('请输入账本名称')
  saving.value = true
  try {
    await accountingApi.createBook({ ...form.value, familyId: authStore.currentFamily?.id })
    ElMessage.success('创建成功')
    showCreate.value = false
    form.value = { name: '', type: 'family', description: '' }
    loadBooks()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}
</script>

<style scoped>
.books-page {
  animation: pageIn 0.4s ease-out;
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 账本网格 */
.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.book-card {
  cursor: pointer;
  transition: all 0.25s;
  padding: 20px;
}
.book-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);
}

.book-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.book-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.book-icon.family {
  background: linear-gradient(135deg, #667eea, #764ba2);
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.3);
}
.book-icon.personal {
  background: linear-gradient(135deg, #34d399, #10b981);
  box-shadow: 0 4px 14px rgba(52, 211, 153, 0.3);
}

.book-more {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: all 0.2s;
}
.book-more:hover {
  background: #f1f5f9;
  color: #64748b;
}

.book-name {
  font-size: 17px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}
.book-desc {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 14px;
  line-height: 1.5;
}
.book-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 空状态 */
.empty-card {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
}
.empty-card p {
  margin-top: 12px;
  color: #94a3b8;
  font-size: 14px;
}

/* 删除弹窗 */
.delete-warn {
  display: flex;
  gap: 14px;
  padding: 16px;
  background: #fef2f2;
  border-radius: 12px;
  border: 1px solid #fecaca;
}
.warn-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #fee2e2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.warn-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 6px;
}
.warn-detail {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
}
.warn-detail strong {
  color: #ef4444;
}

.force-check {
  margin-top: 16px;
}
.force-check :deep(.el-checkbox__label) {
  font-size: 13px;
  color: #64748b;
}

/* 弹窗样式 */
.form-dialog :deep(.el-dialog) {
  border-radius: 20px;
}
.form-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  margin: 0;
  border-bottom: 1px solid #f1f5f9;
}
.form-dialog :deep(.el-dialog__title) {
  font-size: 17px;
  font-weight: 600;
}
.form-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
}

@media (max-width: 640px) {
  .books-grid {
    grid-template-columns: 1fr;
  }
  .form-dialog :deep(.el-dialog) {
    width: 92vw !important;
    max-width: 92vw !important;
  }
  .form-dialog :deep(.el-dialog__header) {
    padding: 16px 16px 12px;
  }
  .form-dialog :deep(.el-dialog__body) {
    padding: 12px 16px 16px;
    max-height: 70vh;
    overflow-y: auto;
  }
}
</style>
