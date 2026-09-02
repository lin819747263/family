<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div class="page-title" style="margin-bottom:0;">预算管理</div>
      <div style="display:flex;gap:8px;">
        <el-date-picker v-model="month" type="month" placeholder="选择月份" value-format="YYYY-MM" style="width:140px;" @change="loadBudgets" />
        <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon>设置预算</el-button>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="font-weight:600;">总预算</span>
        <span>¥{{ formatMoney(totalBudget) }} / ¥{{ formatMoney(totalSpent) }}</span>
      </div>
      <el-progress :percentage="totalPercent" :color="totalPercent > 90 ? '#F56C6C' : totalPercent > 70 ? '#E6A23C' : '#67C23A'" :stroke-width="16" />
    </div>
    <div v-if="loading" class="card" style="text-align:center;padding:40px;">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
    </div>

    <el-row v-else :gutter="16">
      <el-col :xs="24" :sm="8" v-for="b in budgets" :key="b.id" style="margin-bottom:16px;">
        <div class="card budget-card">
          <div class="budget-actions">
            <button class="ba-btn" @click="openEdit(b)" title="编辑"><el-icon :size="14"><Edit /></el-icon></button>
            <el-popconfirm title="确定删除此预算？" @confirm="handleDelete(b.id)">
              <template #reference>
                <button class="ba-btn danger" title="删除"><el-icon :size="14"><Delete /></el-icon></button>
              </template>
            </el-popconfirm>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="font-weight:600;">{{ b.Category?.name || '总预算' }}</span>
            <span style="font-size:13px;color:#999;">{{ formatMoney(b.spent) }} / {{ formatMoney(b.amount) }}</span>
          </div>
          <el-progress :percentage="b.percent" :color="b.percent > 90 ? '#F56C6C' : b.percent > 70 ? '#E6A23C' : '#67C23A'" />
        </div>
      </el-col>
      <el-col v-if="budgets.length === 0" :span="24">
        <div class="card" style="text-align:center;padding:40px;">
          <el-icon :size="48" color="#cbd5e1"><Coin /></el-icon>
          <p style="margin-top:12px;color:#94a3b8;">还没有预算，点击右上角设置</p>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑预算' : '设置预算'" width="420px" destroy-on-close>
      <el-form :model="budgetForm" label-width="80px">
        <el-form-item label="分类">
          <el-select v-model="budgetForm.categoryId" placeholder="选择分类(不选为总预算)" style="width:100%" clearable filterable :disabled="isEdit">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="预算金额">
          <el-input v-model="budgetForm.amount" type="number" placeholder="输入预算金额">
            <template #append>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="预警">
          <el-slider v-model="budgetForm.warnPercent" :min="50" :max="100" show-input />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { accountingApi } from '@/api'
import { useAccountingStore } from '@/store/accounting'
import { useAuthStore } from '@/store/auth'
import { formatMoney } from '@/utils/format'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const accountingStore = useAccountingStore()
const budgets = ref([])
const categories = ref([])
const month = ref(dayjs().format('YYYY-MM'))
const loading = ref(false)
const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const saving = ref(false)
const budgetForm = reactive({ categoryId: null, amount: '', warnPercent: 80 })

const totalBudget = computed(() => budgets.value.reduce((s, b) => s + parseFloat(b.amount || 0), 0))
const totalSpent = computed(() => budgets.value.reduce((s, b) => s + parseFloat(b.spent || 0), 0))
const totalPercent = computed(() => totalBudget.value > 0 ? Math.round((totalSpent.value / totalBudget.value) * 100) : 0)

onMounted(async () => {
  const res = await accountingApi.getCategories({ type: 'expense', familyId: authStore.currentFamily?.id })
  const allCategories = res.data || []
  // 构建树形结构：一级分类 + 缩进的二级分类
  const parentCategories = allCategories.filter(c => !c.parentId)
  const childCategories = allCategories.filter(c => c.parentId)
  const treeCategories = []
  for (const parent of parentCategories) {
    treeCategories.push(parent)
    const children = childCategories.filter(c => c.parentId === parent.id)
    for (const child of children) {
      treeCategories.push({ ...child, name: `  └ ${child.name}` })
    }
  }
  categories.value = treeCategories
  if (accountingStore.currentBookId) loadBudgets()
})

watch(() => accountingStore.currentBookId, (id) => {
  if (id) loadBudgets()
})

async function loadBudgets() {
  if (!accountingStore.currentBookId) return
  loading.value = true
  try {
    const res = await accountingApi.getBudgets({ bookId: accountingStore.currentBookId, month: month.value })
    budgets.value = res.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function openCreate() {
  isEdit.value = false
  editId.value = null
  budgetForm.categoryId = null
  budgetForm.amount = ''
  budgetForm.warnPercent = 80
  showDialog.value = true
}

function openEdit(b) {
  isEdit.value = true
  editId.value = b.id
  budgetForm.categoryId = b.categoryId
  budgetForm.amount = b.amount
  budgetForm.warnPercent = b.warnPercent || 80
  showDialog.value = true
}

async function handleSave() {
  if (!budgetForm.amount) return ElMessage.warning('请输入预算金额')
  saving.value = true
  try {
    await accountingApi.setBudget({ bookId: accountingStore.currentBookId, ...budgetForm })
    ElMessage.success(isEdit.value ? '预算更新成功' : '预算设置成功')
    showDialog.value = false
    loadBudgets()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

async function handleDelete(id) {
  try {
    await accountingApi.deleteBudget(id)
    ElMessage.success('预算已删除')
    loadBudgets()
  } catch (e) { console.error(e) }
}
</script>

<style scoped>
.budget-card {
  position: relative;
}
.budget-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}
.budget-card:hover .budget-actions {
  opacity: 1;
}
.ba-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(8px);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: all 0.2s;
}
.ba-btn:hover {
  background: #fff;
  color: #64748b;
}
.ba-btn.danger:hover {
  color: #f87171;
}
</style>
