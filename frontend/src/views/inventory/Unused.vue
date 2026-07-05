<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div class="page-title" style="margin-bottom:0;">断舍离助手</div>
      <div style="display:flex;gap:8px;align-items:center;">
        <span style="font-size:13px;color:#999;">超过</span>
        <el-select v-model="months" style="width:100px;" @change="loadItems">
          <el-option label="6个月" :value="6" />
          <el-option label="12个月" :value="12" />
          <el-option label="24个月" :value="24" />
        </el-select>
        <span style="font-size:13px;color:#999;">未使用</span>
      </div>
    </div>

    <el-alert style="margin-bottom:16px;" title="以下物品可能已经很久没有使用，可以考虑丢弃、捐赠或二手出售。" type="warning" show-icon :closable="false" />

    <div v-if="items.length === 0" class="card" style="text-align:center;padding:60px;">
      <el-icon :size="48" color="#67C23A"><Check /></el-icon>
      <p style="margin-top:12px;color:#999;">没有发现长期未使用的物品，继续保持！</p>
    </div>


    <div class="card">
      <div class="table-wrap">
      <el-table :data="items" stripe>
        <el-table-column prop="name" label="物品名称" min-width="120" />
        <el-table-column label="分类" width="100">
          <template #default="{ row }"><el-tag size="small">{{ row.category || '未分类' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="位置" width="150">
          <template #default="{ row }">{{ row.Space?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="购买日期" width="110">
          <template #default="{ row }">{{ row.purchaseDate || '-' }}</template>
        </el-table-column>
        <el-table-column label="价格" width="100">
          <template #default="{ row }">{{ row.price ? `¥${parseFloat(row.price).toFixed(2)}` : '-' }}</template>
        </el-table-column>
        <el-table-column label="最后使用" width="110">
          <template #default="{ row }">{{ row.lastUsedDate || dayjs(row.createdAt).format('YYYY-MM-DD') || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-popconfirm title="确认丢弃？" @confirm="handleAction(row, 'discarded')">
              <template #reference><el-button text type="danger" size="small">丢弃</el-button></template>
            </el-popconfirm>
            <el-popconfirm title="确认捐赠？" @confirm="handleAction(row, 'donated')">
              <template #reference><el-button text type="warning" size="small">捐赠</el-button></template>
            </el-popconfirm>
            <el-popconfirm title="标记为二手出售？" @confirm="handleAction(row, 'sold')">
              <template #reference><el-button text type="primary" size="small">二手出售</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, onMounted } from 'vue'
import { inventoryApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const items = ref([])
const months = ref(12)

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadItems()
})

async function loadItems() {
  const res = await inventoryApi.getUnused({ familyId: authStore.currentFamily?.id, months: months.value })
  items.value = res.data
}

const statusLabels = { discarded: '丢弃', donated: '捐赠', sold: '二手出售' }

async function handleAction(row, status) {
  try {
    await inventoryApi.updateItem(row.id, { status })
    ElMessage.success(`已标记为${statusLabels[status]}`)
    items.value = items.value.filter(i => i.id !== row.id)
  } catch { /* request.js 已处理错误提示 */ }
}
</script>
