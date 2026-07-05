<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div class="page-title" style="margin-bottom:0;">借物追踪</div>
      <div style="display:flex;gap:8px;">
        <el-select v-model="filterStatus" style="width:120px;" @change="loadBorrows">
          <el-option label="全部" value="" />
          <el-option label="借出中" value="borrowed" />
          <el-option label="已归还" value="returned" />
          <el-option label="逾期" value="overdue" />
        </el-select>
        <el-button type="primary" @click="showForm = true"><el-icon><Plus /></el-icon>登记借出</el-button>
      </div>
    </div>

    <div class="card" style="padding:0;">
      <div v-if="borrows.length === 0" style="text-align:center;padding:60px 20px;">
        <el-icon :size="48" color="#cbd5e1"><Share /></el-icon>
        <p style="margin-top:12px;color:#94a3b8;">暂无借出记录</p>
      </div>
      <div v-else class="table-wrap">
      <el-table :data="borrows" stripe>
        <el-table-column label="物品" min-width="120">
          <template #default="{ row }">{{ row.Item?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="借用人" width="120">
          <template #default="{ row }">{{ row.borrower?.nickname || '-' }}</template>
        </el-table-column>
        <el-table-column label="出借人" width="120">
          <template #default="{ row }">{{ row.lender?.nickname || '-' }}</template>
        </el-table-column>
        <el-table-column label="借出日期" width="110">
          <template #default="{ row }">{{ row.borrowDate }}</template>
        </el-table-column>
        <el-table-column label="预计归还" width="110">
          <template #default="{ row }">{{ row.expectedReturnDate || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'returned' ? 'success' : row.status === 'overdue' ? 'danger' : 'warning'" size="small">
              {{ { borrowed: '借出中', returned: '已归还', overdue: '逾期' }[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status !== 'returned'" text type="primary" size="small" @click="handleReturn(row.id)">确认归还</el-button>
            <el-button v-if="row.status === 'borrowed'" text type="warning" size="small" @click="handleRemind(row.id)">催还</el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>
    </div>

    <el-dialog v-model="showForm" title="登记借出" width="420px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="物品">
          <el-select v-model="form.itemId" filterable placeholder="搜索物品" style="width:100%">
            <el-option v-for="i in allItems" :key="i.id" :label="i.name" :value="i.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="借用人">
          <el-select v-model="form.borrowedBy" filterable placeholder="选择家庭成员" style="width:100%">
            <el-option v-for="m in familyMembers" :key="m.userId || m.id" :label="m.nickname || m.User?.nickname || '成员'" :value="m.userId || m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="预计归还">
          <el-date-picker v-model="form.expectedReturnDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleCreate">登记</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, onMounted } from 'vue'
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
const form = ref({ itemId: null, borrowedBy: '', expectedReturnDate: '', note: '' })

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadBorrows()
  const [itemsRes, membersRes] = await Promise.all([
    inventoryApi.getItems({ familyId: authStore.currentFamily.id, pageSize: 200 }),
    familyApi.getMembers({ familyId: authStore.currentFamily.id })
  ])
  allItems.value = itemsRes.data.list
  familyMembers.value = membersRes.data || []
})

async function loadBorrows() {
  const params = { familyId: authStore.currentFamily.id, pageSize: 50 }
  if (filterStatus.value) params.status = filterStatus.value
  const res = await inventoryApi.getBorrows(params)
  borrows.value = res.data.list
}

async function handleCreate() {
  if (!form.value.itemId || !form.value.borrowedBy) return ElMessage.warning('请填写完整信息')
  saving.value = true
  try {
    await inventoryApi.createBorrow(form.value)
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
