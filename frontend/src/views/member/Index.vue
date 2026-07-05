<template>
  <div class="member-page">
    <!-- ========== 列表视图 ========== -->
    <template v-if="!showDetail">
      <div class="page-header">
        <div>
          <div class="page-title">家庭成员档案</div>
          <p class="page-desc">记录每位家人的健康数据、饮食偏好和兴趣爱好</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon>添加成员</el-button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      </div>
      <div v-else-if="list.length === 0" class="empty-card card">
        <el-icon :size="56" color="#cbd5e1"><User /></el-icon>
        <p class="empty-title">还没有成员档案</p>
        <p class="empty-desc">添加家庭成员，记录他们的健康和喜好</p>
        <el-button type="primary" @click="openCreate" style="margin-top:12px;"><el-icon><Plus /></el-icon>添加第一位成员</el-button>
      </div>
      <div v-else class="member-grid">
        <div v-for="p in list" :key="p.id" class="member-card card" @click="openDetail(p)">
          <div class="mc-header">
            <el-avatar :size="56" :src="p.avatar" class="mc-avatar">{{ p.name[0] }}</el-avatar>
            <div class="mc-info">
              <div class="mc-name">{{ p.name }}</div>
              <div class="mc-meta">
                <span v-if="p.gender">{{ genderLabel(p.gender) }}</span>
                <span v-if="p.birthday">{{ calcAge(p.birthday) }}岁</span>
                <span v-if="p.currentHeight">{{ p.currentHeight }}cm</span>
                <span v-if="p.currentWeight">{{ p.currentWeight }}kg</span>
              </div>
            </div>
          </div>
          <div v-if="p.hobbies?.length" class="mc-tags">
            <el-tag v-for="h in p.hobbies.slice(0, 3)" :key="h" size="small" effect="plain" round>{{ h }}</el-tag>
            <span v-if="p.hobbies.length > 3" class="mc-more">+{{ p.hobbies.length - 3 }}</span>
          </div>
          <div v-if="p.favoriteFoods?.length" class="mc-food">
            <span class="mc-food-label">爱吃</span>
            {{ p.favoriteFoods.slice(0, 3).join('、') }}
            <span v-if="p.favoriteFoods.length > 3">等{{ p.favoriteFoods.length }}种</span>
          </div>
        </div>
      </div>
    </template>

    <!-- ========== 详情视图 ========== -->
    <template v-else>
      <div class="detail-page">
        <div class="detail-top-bar">
          <el-button text @click="showDetail = false"><el-icon><ArrowLeft /></el-icon>返回列表</el-button>
          <div class="top-actions">
            <el-button @click="openEdit(detailProfile)"><el-icon><Edit /></el-icon>编辑</el-button>
            <el-popconfirm title="确定删除此成员档案？" @confirm="handleDelete(detailProfile.id)">
              <template #reference>
                <el-button type="danger" plain><el-icon><Delete /></el-icon>删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>

        <!-- 个人信息头部 -->
        <div class="detail-hero card">
          <el-avatar :size="80" :src="detailProfile.avatar" class="hero-avatar">{{ detailProfile.name?.[0] }}</el-avatar>
          <div class="hero-info">
            <div class="hero-name">{{ detailProfile.name }}</div>
            <div class="hero-meta">
              <span v-if="detailProfile.gender"><el-icon><User /></el-icon>{{ genderLabel(detailProfile.gender) }}</span>
              <span v-if="detailProfile.birthday"><el-icon><Calendar /></el-icon>{{ detailProfile.birthday }}（{{ calcAge(detailProfile.birthday) }}岁）</span>
              <span v-if="detailProfile.bloodType">🩸 {{ detailProfile.bloodType }}型</span>
              <span v-if="detailProfile.phone"><el-icon><Phone /></el-icon>{{ detailProfile.phone }}</span>
            </div>
          </div>
          <div class="hero-stats">
            <div class="hs-item" v-if="latestHeight">
              <div class="hs-num">{{ latestHeight }}</div>
              <div class="hs-unit">cm 身高</div>
              <div v-if="heightChange" class="hs-change" :class="{ up: heightChange > 0, down: heightChange < 0 }">
                {{ heightChange > 0 ? '+' : '' }}{{ heightChange }}
              </div>
            </div>
            <div class="hs-item" v-if="latestWeight">
              <div class="hs-num">{{ latestWeight }}</div>
              <div class="hs-unit">kg 体重</div>
              <div v-if="weightChange" class="hs-change" :class="{ up: weightChange > 0, down: weightChange < 0 }">
                {{ weightChange > 0 ? '+' : '' }}{{ weightChange }}
              </div>
            </div>
          </div>
        </div>

        <div class="detail-columns">
          <!-- 左栏：偏好 -->
          <div class="detail-left">
            <div class="card detail-card">
              <div class="dc-title">饮食偏好</div>
              <div v-if="detailProfile.favoriteFoods?.length" class="detail-section">
                <div class="ds-label">爱吃的食物</div>
                <div class="ds-tags"><el-tag v-for="f in detailProfile.favoriteFoods" :key="f" type="success" effect="light" round>{{ f }}</el-tag></div>
              </div>
              <div v-if="detailProfile.dislikedFoods?.length" class="detail-section">
                <div class="ds-label">不爱吃的食物</div>
                <div class="ds-tags"><el-tag v-for="f in detailProfile.dislikedFoods" :key="f" type="danger" effect="light" round>{{ f }}</el-tag></div>
              </div>
              <div v-if="!detailProfile.favoriteFoods?.length && !detailProfile.dislikedFoods?.length" class="ds-empty">暂无饮食偏好记录</div>
            </div>
            <div class="card detail-card">
              <div class="dc-title">兴趣爱好</div>
              <div v-if="detailProfile.hobbies?.length" class="ds-tags"><el-tag v-for="h in detailProfile.hobbies" :key="h" type="primary" effect="light" round>{{ h }}</el-tag></div>
              <div v-else class="ds-empty">暂无爱好记录</div>
            </div>
            <div class="card detail-card">
              <div class="dc-title">健康信息</div>
              <div v-if="detailProfile.allergies?.length" class="detail-section">
                <div class="ds-label">过敏信息</div>
                <div class="ds-tags"><el-tag v-for="a in detailProfile.allergies" :key="a" type="warning" effect="light" round>{{ a }}</el-tag></div>
              </div>
              <div v-if="detailProfile.notes" class="detail-section">
                <div class="ds-label">备注</div>
                <div class="ds-notes">{{ detailProfile.notes }}</div>
              </div>
              <div v-if="!detailProfile.allergies?.length && !detailProfile.notes" class="ds-empty">暂无健康信息</div>
            </div>
          </div>

          <!-- 右栏：体测记录 -->
          <div class="detail-right">
            <div class="card detail-card">
              <div class="dc-header">
                <div class="dc-title">体测记录</div>
                <el-button type="primary" size="small" @click="openRecordForm()"><el-icon><Plus /></el-icon>记录</el-button>
              </div>

              <!-- 图表切换 -->
              <div class="chart-tabs">
                <button class="chart-tab" :class="{ active: chartTab === 'weight' }" @click="switchChart('weight')">体重</button>
                <button class="chart-tab" :class="{ active: chartTab === 'height' }" @click="switchChart('height')">身高</button>
              </div>

              <!-- 体重图表 -->
              <div v-show="chartTab === 'weight'">
                <div v-if="weightRecords.length > 1" ref="weightChartRef" class="record-chart"></div>
                <div v-else class="ds-empty">至少需要2条记录才能显示图表</div>
              </div>

              <!-- 身高图表 -->
              <div v-show="chartTab === 'height'">
                <div v-if="heightRecords.length > 1" ref="heightChartRef" class="record-chart"></div>
                <div v-else class="ds-empty">至少需要2条记录才能显示图表</div>
              </div>

              <!-- 记录列表 -->
              <div class="record-list">
                <div v-for="r in mergedRecords" :key="r.key" class="record-row">
                  <span class="rr-date">{{ formatDate(r.recordDate) }}</span>
                  <span v-if="r.weight" class="rr-val weight">{{ r.weight }} kg</span>
                  <span v-if="r.height" class="rr-val height">{{ r.height }} cm</span>
                  <span v-if="r.note" class="rr-note">{{ r.note }}</span>
                  <div class="rr-actions">
                    <button class="rr-btn" @click="openEditRecord(r)" title="编辑"><el-icon :size="13"><Edit /></el-icon></button>
                    <el-popconfirm title="删除此记录？" @confirm="handleDeleteRecord(r)">
                      <template #reference>
                        <button class="rr-btn danger" title="删除"><el-icon :size="13"><Delete /></el-icon></button>
                      </template>
                    </el-popconfirm>
                  </div>
                </div>
                <div v-if="mergedRecords.length === 0" class="ds-empty">暂无记录</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 添加/编辑成员弹窗 -->
    <el-dialog v-model="showForm" :title="isEdit ? '编辑成员' : '添加成员'" width="560px" class="form-dialog" :close-on-click-modal="false">
      <el-form :model="form" label-width="80px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="姓名" required><el-input v-model="form.name" placeholder="姓名" maxlength="50" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="性别"><el-select v-model="form.gender" placeholder="可选" clearable style="width:100%;"><el-option label="男" value="male" /><el-option label="女" value="female" /><el-option label="其他" value="other" /></el-select></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="生日"><el-date-picker v-model="form.birthday" type="date" placeholder="可选" value-format="YYYY-MM-DD" style="width:100%;" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="身高(cm)"><el-input-number v-model="form.height" :min="30" :max="250" :precision="1" style="width:100%;" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="血型"><el-select v-model="form.bloodType" placeholder="可选" clearable style="width:100%;"><el-option label="A" value="A" /><el-option label="B" value="B" /><el-option label="AB" value="AB" /><el-option label="O" value="O" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="电话"><el-input v-model="form.phone" placeholder="可选" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="爱吃的食物"><el-select v-model="form.favoriteFoods" multiple filterable allow-create placeholder="输入后回车添加" style="width:100%;"><el-option v-for="f in form.favoriteFoods" :key="f" :label="f" :value="f" /></el-select></el-form-item>
        <el-form-item label="不爱吃的"><el-select v-model="form.dislikedFoods" multiple filterable allow-create placeholder="输入后回车添加" style="width:100%;"><el-option v-for="f in form.dislikedFoods" :key="f" :label="f" :value="f" /></el-select></el-form-item>
        <el-form-item label="爱好"><el-select v-model="form.hobbies" multiple filterable allow-create placeholder="输入后回车添加" style="width:100%;"><el-option v-for="h in form.hobbies" :key="h" :label="h" :value="h" /></el-select></el-form-item>
        <el-form-item label="过敏信息"><el-select v-model="form.allergies" multiple filterable allow-create placeholder="输入后回车添加" style="width:100%;"><el-option v-for="a in form.allergies" :key="a" :label="a" :value="a" /></el-select></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.notes" type="textarea" :rows="2" placeholder="可选" maxlength="500" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>

    <!-- 记录体测弹窗（体重+身高合并） -->
    <el-dialog v-model="showRecordForm" :title="isEditRecord ? '编辑记录' : '记录体测数据'" width="420px" class="form-dialog">
      <el-form :model="recordForm" label-width="60px">
        <el-form-item label="日期">
          <el-date-picker v-model="recordForm.recordDate" type="date" value-format="YYYY-MM-DD" style="width:100%;" />
        </el-form-item>
        <el-form-item label="体重">
          <el-input-number v-model="recordForm.weight" :min="1" :max="300" :precision="1" style="width:180px;" />
          <span style="margin-left:8px;color:#94a3b8;">kg</span>
        </el-form-item>
        <el-form-item label="身高">
          <el-input-number v-model="recordForm.height" :min="30" :max="250" :precision="1" style="width:180px;" />
          <span style="margin-left:8px;color:#94a3b8;">cm</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="recordForm.note" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRecordForm = false">取消</el-button>
        <el-button type="primary" :loading="savingRecord" @click="handleSaveRecord">{{ isEditRecord ? '保存' : '记录' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { memberProfileApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const list = ref([])
const loading = ref(false)
const showForm = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const saving = ref(false)

const showDetail = ref(false)
const detailProfile = ref(null)
const chartTab = ref('weight')

// 体测记录
const showRecordForm = ref(false)
const isEditRecord = ref(false)
const editingRecord = ref(null)
const savingRecord = ref(false)
const weightRecords = ref([])
const heightRecords = ref([])
const weightChartRef = ref(null)
const heightChartRef = ref(null)
const recordForm = ref({ weight: null, height: null, recordDate: dayjs().format('YYYY-MM-DD'), note: '' })

const defaultForm = {
  name: '', gender: '', birthday: '', height: null, bloodType: '', phone: '',
  favoriteFoods: [], dislikedFoods: [], hobbies: [], allergies: [], notes: ''
}
const form = ref({ ...defaultForm })

function genderLabel(g) { return { male: '男', female: '女', other: '其他' }[g] || '' }
function calcAge(b) { return b ? dayjs().diff(dayjs(b), 'year') : '' }
function formatDate(d) { return dayjs(d).format('M月D日') }

const latestWeight = computed(() => weightRecords.value.length ? weightRecords.value[0].weight : null)
const latestHeight = computed(() => heightRecords.value.length ? heightRecords.value[0].height : null)
const weightChange = computed(() => {
  if (weightRecords.value.length < 2) return null
  return Math.round((parseFloat(weightRecords.value[0].weight) - parseFloat(weightRecords.value[1].weight)) * 10) / 10
})
const heightChange = computed(() => {
  if (heightRecords.value.length < 2) return null
  return Math.round((parseFloat(heightRecords.value[0].height) - parseFloat(heightRecords.value[1].height)) * 10) / 10
})

// 合并体重和身高记录，按日期分组
const mergedRecords = computed(() => {
  const map = {}
  weightRecords.value.forEach(r => {
    const key = r.recordDate
    if (!map[key]) map[key] = { key, recordDate: r.recordDate, note: r.note }
    map[key].weight = r.weight
    map[key].weightId = r.id
  })
  heightRecords.value.forEach(r => {
    const key = r.recordDate
    if (!map[key]) map[key] = { key, recordDate: r.recordDate, note: r.note }
    map[key].height = r.height
    map[key].heightId = r.id
  })
  return Object.values(map).sort((a, b) => b.recordDate.localeCompare(a.recordDate))
})

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadList()
})

async function loadList() {
  loading.value = true
  try { list.value = (await memberProfileApi.getList({ familyId: authStore.currentFamily?.id })).data }
  catch (e) { console.error(e) }
  finally { loading.value = false }
}

function openCreate() { isEdit.value = false; editId.value = null; form.value = { ...defaultForm }; showForm.value = true }
function openEdit(item) {
  isEdit.value = true; editId.value = item.id
  form.value = { name: item.name, gender: item.gender || '', birthday: item.birthday || '', height: item.height, bloodType: item.bloodType || '', phone: item.phone || '', favoriteFoods: [...(item.favoriteFoods || [])], dislikedFoods: [...(item.dislikedFoods || [])], hobbies: [...(item.hobbies || [])], allergies: [...(item.allergies || [])], notes: item.notes || '' }
  showForm.value = true
}

async function handleSave() {
  if (!form.value.name) return ElMessage.warning('请输入姓名')
  saving.value = true
  try {
    const data = { ...form.value, familyId: authStore.currentFamily?.id }
    if (isEdit.value) { await memberProfileApi.update(editId.value, data); ElMessage.success('更新成功') }
    else { await memberProfileApi.create(data); ElMessage.success('添加成功') }
    showForm.value = false; loadList()
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

async function handleDelete(id) {
  try { await memberProfileApi.remove(id); ElMessage.success('已删除'); showDetail.value = false; loadList() }
  catch (e) { console.error(e) }
}

async function openDetail(profile) {
  detailProfile.value = profile; showDetail.value = true
  weightRecords.value = []; heightRecords.value = []
  chartTab.value = 'weight'
  try {
    const res = await memberProfileApi.getOne(profile.id)
    detailProfile.value = res.data
    weightRecords.value = res.data.WeightRecords || []
    heightRecords.value = res.data.HeightRecords || []
    // 等 DOM 渲染完成后再绘制图表
    setTimeout(() => renderWeightChart(), 100)
  } catch (e) { console.error(e) }
}

// 打开记录表单
function openRecordForm(existing) {
  isEditRecord.value = !!existing
  editingRecord.value = existing || null
  recordForm.value = existing ? {
    weight: existing.weight || null, height: existing.height || null,
    recordDate: existing.recordDate, note: existing.note || ''
  } : { weight: null, height: null, recordDate: dayjs().format('YYYY-MM-DD'), note: '' }
  showRecordForm.value = true
}

function openEditRecord(r) {
  openRecordForm({
    weight: r.weight ? parseFloat(r.weight) : null,
    height: r.height ? parseFloat(r.height) : null,
    recordDate: r.recordDate, note: r.note || '',
    weightId: r.weightId, heightId: r.heightId
  })
}

async function handleSaveRecord() {
  if (!recordForm.value.weight && !recordForm.value.height) return ElMessage.warning('请输入体重或身高')
  savingRecord.value = true
  try {
    if (isEditRecord.value && editingRecord.value) {
      // 编辑模式：分别更新体重和身高
      const rec = editingRecord.value
      if (recordForm.value.weight && rec.weightId) {
        await memberProfileApi.updateRecord(detailProfile.value.id, 'weight', rec.weightId, { value: recordForm.value.weight, recordDate: recordForm.value.recordDate, note: recordForm.value.note })
      }
      if (recordForm.value.height && rec.heightId) {
        await memberProfileApi.updateRecord(detailProfile.value.id, 'height', rec.heightId, { value: recordForm.value.height, recordDate: recordForm.value.recordDate, note: recordForm.value.note })
      }
      // 如果原来没有某项，现在新增
      if (recordForm.value.weight && !rec.weightId) {
        await memberProfileApi.addRecord(detailProfile.value.id, { weight: recordForm.value.weight, recordDate: recordForm.value.recordDate, note: recordForm.value.note })
      }
      if (recordForm.value.height && !rec.heightId) {
        await memberProfileApi.addRecord(detailProfile.value.id, { height: recordForm.value.height, recordDate: recordForm.value.recordDate, note: recordForm.value.note })
      }
      ElMessage.success('更新成功')
    } else {
      await memberProfileApi.addRecord(detailProfile.value.id, recordForm.value)
      ElMessage.success('记录成功')
    }
    showRecordForm.value = false
    refreshDetail()
  } catch (e) { console.error(e) }
  finally { savingRecord.value = false }
}

async function handleDeleteRecord(r) {
  try {
    if (r.weightId) await memberProfileApi.deleteRecord(detailProfile.value.id, 'weight', r.weightId)
    if (r.heightId) await memberProfileApi.deleteRecord(detailProfile.value.id, 'height', r.heightId)
    ElMessage.success('已删除')
    refreshDetail()
  } catch (e) { console.error(e) }
}

async function refreshDetail() {
  const res = await memberProfileApi.getOne(detailProfile.value.id)
  detailProfile.value = res.data
  weightRecords.value = res.data.WeightRecords || []
  heightRecords.value = res.data.HeightRecords || []
  loadList()
}

// 图表渲染
let weightChartInstance = null
let heightChartInstance = null
let resizeHandler = null

function switchChart(tab) {
  chartTab.value = tab
  setTimeout(() => {
    if (tab === 'weight') renderWeightChart()
    else renderHeightChart()
  }, 50)
}

watch(weightRecords, () => { nextTick(() => renderWeightChart()) }, { deep: true })
watch(heightRecords, () => { nextTick(() => renderHeightChart()) }, { deep: true })

function renderWeightChart() {
  if (!weightChartRef.value || weightRecords.value.length < 2) return
  if (weightChartRef.value.offsetWidth === 0) return
  const data = weightRecords.value.slice().reverse().map(r => ({ date: r.recordDate, value: parseFloat(r.weight) }))
  if (weightChartInstance) { weightChartInstance.dispose() }
  weightChartInstance = renderChart(weightChartRef.value, data, '体重', 'kg', '#667eea')
}
function renderHeightChart() {
  if (!heightChartRef.value || heightRecords.value.length < 2) return
  if (heightChartRef.value.offsetWidth === 0) return
  const data = heightRecords.value.slice().reverse().map(r => ({ date: r.recordDate, value: parseFloat(r.height) }))
  if (heightChartInstance) { heightChartInstance.dispose() }
  heightChartInstance = renderChart(heightChartRef.value, data, '身高', 'cm', '#10b981')
}
function renderChart(el, data, label, unit, color) {
  return import('echarts').then(echarts => {
    const chart = echarts.init(el)
    chart.setOption({
      grid: { top: 20, right: 20, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: data.map(d => dayjs(d.date).format('M/D')), axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { color: '#94a3b8' } },
      yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#94a3b8' } },
      series: [{ type: 'line', data: data.map(d => d.value), smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { color, width: 2 }, itemStyle: { color }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + '33' }, { offset: 1, color: color + '00' }] } } }],
      tooltip: { trigger: 'axis', formatter: p => `${p[0].axisValue}<br/>${label}: <b>${p[0].value} ${unit}</b>` }
    })
    return chart
  })
}

// 统一的 resize 处理
function handleChartResize() {
  weightChartInstance?.resize()
  heightChartInstance?.resize()
}

onMounted(() => {
  resizeHandler = handleChartResize
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler)
  weightChartInstance?.dispose()
  heightChartInstance?.dispose()
})
</script>

<style scoped>
.member-page { animation: pageIn 0.4s ease-out; }
@keyframes pageIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-desc { font-size: 14px; color: #94a3b8; margin-top: 4px; }
.header-actions { display: flex; gap: 8px; flex-shrink: 0; }

.card { background: rgba(255,255,255,0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.8); border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.empty-card { text-align: center; padding: 60px 20px; }
.empty-title { font-size: 17px; font-weight: 600; color: #64748b; margin-top: 16px; }
.empty-desc { font-size: 14px; color: #94a3b8; margin-top: 6px; }

/* 列表卡片 */
.member-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.member-card { padding: 20px; cursor: pointer; transition: all 0.25s; }
.member-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.08); }
.mc-header { display: flex; gap: 14px; margin-bottom: 12px; }
.mc-avatar { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-weight: 700; font-size: 20px; flex-shrink: 0; }
.mc-info { flex: 1; min-width: 0; }
.mc-name { font-size: 18px; font-weight: 700; color: #1e293b; }
.mc-meta { display: flex; gap: 10px; margin-top: 4px; font-size: 13px; color: #94a3b8; }
.mc-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.mc-more { font-size: 12px; color: #94a3b8; }
.mc-food { font-size: 13px; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-food-label { color: #f59e0b; font-weight: 600; margin-right: 4px; }

/* 详情页 */
.detail-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.top-actions { display: flex; gap: 8px; }

.detail-hero { display: flex; align-items: center; gap: 24px; padding: 28px; margin-bottom: 20px; }
.hero-avatar { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-weight: 700; font-size: 28px; flex-shrink: 0; }
.hero-info { flex: 1; }
.hero-name { font-size: 26px; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
.hero-meta { display: flex; flex-wrap: wrap; gap: 16px; font-size: 14px; color: #64748b; }
.hero-meta span { display: flex; align-items: center; gap: 4px; }

.hero-stats { display: flex; gap: 16px; flex-shrink: 0; }
.hs-item { text-align: center; padding: 12px 20px; background: #f8fafc; border-radius: 14px; min-width: 80px; }
.hs-num { font-size: 32px; font-weight: 800; color: #1e293b; line-height: 1.2; }
.hs-unit { font-size: 12px; color: #94a3b8; }
.hs-change { font-size: 13px; font-weight: 600; margin-top: 2px; }
.hs-change.up { color: #ef4444; }
.hs-change.down { color: #10b981; }

.detail-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.detail-left, .detail-right { display: flex; flex-direction: column; gap: 16px; }
.detail-card { padding: 20px; }
.dc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.dc-title { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
.dc-header .dc-title { margin-bottom: 0; }

.detail-section { margin-bottom: 16px; }
.detail-section:last-child { margin-bottom: 0; }
.ds-label { font-size: 13px; color: #94a3b8; margin-bottom: 8px; font-weight: 500; }
.ds-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.ds-notes { font-size: 14px; color: #64748b; line-height: 1.6; }
.ds-empty { font-size: 13px; color: #cbd5e1; text-align: center; padding: 16px; }

/* 图表 */
.chart-tabs { display: flex; gap: 4px; background: #f1f5f9; border-radius: 10px; padding: 3px; margin-bottom: 16px; }
.chart-tab {
  flex: 1; padding: 6px 12px; border: none; border-radius: 8px;
  background: transparent; font-size: 13px; font-weight: 500;
  color: #94a3b8; cursor: pointer; transition: all 0.2s;
}
.chart-tab.active { background: #fff; color: #667eea; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.chart-tab:hover:not(.active) { color: #64748b; }
.record-chart { height: 220px; }

/* 记录列表 */
.record-list { display: flex; flex-direction: column; gap: 6px; }
.record-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #f8fafc; border-radius: 10px; font-size: 13px; }
.rr-date { color: #94a3b8; min-width: 56px; }
.rr-val { font-weight: 600; min-width: 60px; }
.rr-val.weight { color: #667eea; }
.rr-val.height { color: #10b981; }
.rr-note { color: #64748b; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rr-actions { display: flex; gap: 4px; margin-left: auto; }
.rr-btn { border: none; background: transparent; color: #cbd5e1; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; }
.rr-btn:hover { background: #f1f5f9; color: #64748b; }
.rr-btn.danger:hover { background: #fef2f2; color: #f87171; }

.form-dialog :deep(.el-dialog) { border-radius: 20px; }
.form-dialog :deep(.el-dialog__header) { padding: 20px 24px 16px; margin: 0; border-bottom: 1px solid #f1f5f9; }
.form-dialog :deep(.el-dialog__title) { font-size: 17px; font-weight: 600; }
.form-dialog :deep(.el-dialog__body) { padding: 20px 24px; }

@media (max-width: 900px) {
  .detail-columns { grid-template-columns: 1fr; }
  .detail-hero { flex-wrap: wrap; gap: 16px; }
  .hero-stats { width: 100%; }
  .hs-item { flex: 1; }
}
@media (max-width: 768px) {
  .page-header { flex-direction: column; gap: 12px; }
  .member-grid { grid-template-columns: 1fr; }
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
