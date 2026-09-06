<template>
  <div class="reminder-page">
    <div class="layout">
      <!-- 侧栏 -->
      <aside class="sidebar">
        <div class="sb-head"><div class="sb-title">🔔 家庭提醒</div></div>
        <nav class="sb-nav">
          <div class="sb-item" :class="{ active: activeView === 'todo' }" @click="switchView('todo')">
            <div class="sb-ico g-terra">📝</div>
            <div class="sb-info"><div class="sb-label">清单</div><div class="sb-desc">待办事项管理</div></div>
            <span v-if="todoStats.pending > 0" class="sb-badge">{{ todoStats.pending }}</span>
          </div>
          <div class="sb-item" :class="{ active: activeView === 'calendar' }" @click="switchView('calendar')">
            <div class="sb-ico g-sage">📅</div>
            <div class="sb-info"><div class="sb-label">日历视图</div><div class="sb-desc">日程一览</div></div>
          </div>
          <div class="sb-item" :class="{ active: activeView === 'anniversary' }" @click="switchView('anniversary')">
            <div class="sb-ico g-amber">⭐</div>
            <div class="sb-info"><div class="sb-label">纪念日</div><div class="sb-desc">重要日期提醒</div></div>
            <span v-if="annivCount > 0" class="sb-badge">{{ annivCount }}</span>
          </div>
        </nav>
        <div class="sb-foot">
          <div class="foot-stat"><span class="fs-dot" style="background:var(--sage);"></span>{{ todoStats.pending }} 待办</div>
          <div class="foot-stat"><span class="fs-dot" style="background:var(--rose);"></span>{{ todoStats.overdue }} 过期</div>
        </div>
      </aside>

      <!-- 内容区 -->
      <main class="content">
        <!-- ===== 清单 ===== -->
        <section v-show="activeView === 'todo'" class="panel">
          <div class="panel-head">
            <div><div class="panel-title">📝 待办清单</div><div class="panel-sub">把家里的大小事，一件件安心放下</div></div>
            <button class="btn primary" @click="$refs.todoPage?.openCreate?.()">＋ 新建待办</button>
          </div>
          <TodoPage ref="todoPage" embedded @stats-update="onTodoStatsUpdate" />
        </section>

        <!-- ===== 日历 ===== -->
        <section v-show="activeView === 'calendar'" class="panel">
          <div class="panel-head">
            <div><div class="panel-title">📅 日历视图</div><div class="panel-sub">一家人的日程，摊开在同一张纸上</div></div>
          </div>
          <CalendarPage />
        </section>

        <!-- ===== 纪念日 ===== -->
        <section v-show="activeView === 'anniversary'" class="panel">
          <div class="panel-head">
            <div><div class="panel-title">⭐ 纪念日</div><div class="panel-sub">重要的日子，一个都不错过</div></div>
          </div>
          <AnniversaryPage embedded @count-update="c => annivCount = c" />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { todoApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import TodoPage from '@/views/todo/Index.vue'
import CalendarPage from '@/views/anniversary/Calendar.vue'
import AnniversaryPage from '@/views/anniversary/Index.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeView = ref('todo')
const todoStats = ref({ pending: 0, overdue: 0 })
const annivCount = ref(0)
const todoPage = ref(null)

function switchView(key) {
  activeView.value = key
  router.replace(`/reminder/${key}`)
}

function updateActiveView() {
  const path = route.path
  if (path.includes('/calendar')) activeView.value = 'calendar'
  else if (path.includes('/anniversary')) activeView.value = 'anniversary'
  else activeView.value = 'todo'
}

function onTodoStatsUpdate(stats) {
  todoStats.value = { pending: stats.pending || 0, overdue: stats.overdue || 0 }
}

watch(() => route.path, updateActiveView)

onMounted(async () => {
  updateActiveView()
  // 加载待办统计
  try {
    const familyId = authStore.currentFamily?.id
    if (familyId) {
      const res = await todoApi.getStats({ familyId })
      todoStats.value = { pending: res.data?.pending || 0, overdue: res.data?.overdue || 0 }
    }
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.reminder-page { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

.layout { display: flex; gap: 18px; align-items: flex-start; }

/* ===== 侧栏 ===== */
.sidebar {
  width: 236px; flex-shrink: 0; background: rgba(255, 253, 250, 0.85);
  backdrop-filter: blur(14px); border: 1px solid var(--border);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-md);
  display: flex; flex-direction: column; overflow: hidden;
  position: sticky; top: 80px;
}
.sb-head { padding: 20px 20px 14px; border-bottom: 1px dashed var(--border); }
.sb-title { font-size: 17px; font-weight: 800; color: var(--terra-deep); display: flex; align-items: center; gap: 8px; }
.sb-nav { padding: 10px; display: flex; flex-direction: column; gap: 6px; }
.sb-item {
  display: flex; align-items: center; gap: 12px; padding: 12px 14px;
  border-radius: 14px; cursor: pointer; transition: all 0.25s; position: relative;
}
.sb-item:hover { background: rgba(200, 159, 133, 0.08); }
.sb-item.active { background: rgba(200, 159, 133, 0.14); }
.sb-item.active::before {
  content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 3px; height: 22px; border-radius: 0 3px 3px 0;
  background: linear-gradient(180deg, var(--terracotta), var(--amber));
}
.sb-ico {
  width: 36px; height: 36px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  font-size: 17px; color: #fff; flex-shrink: 0;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.sb-item:hover .sb-ico { transform: scale(1.1) rotate(-6deg); }
.g-terra { background: linear-gradient(135deg, var(--terracotta), var(--terra-deep)); }
.g-sage { background: linear-gradient(135deg, var(--sage), #7E8862); }
.g-amber { background: linear-gradient(135deg, var(--amber), #C08A3E); }
.sb-info { flex: 1; min-width: 0; }
.sb-label { font-size: 14px; font-weight: 600; }
.sb-desc { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
.sb-badge {
  background: var(--terracotta); color: #fff; font-size: 11px; font-weight: 700;
  padding: 2px 8px; border-radius: 10px; min-width: 22px; text-align: center;
}
.sb-foot {
  margin-top: auto; padding: 14px 20px; border-top: 1px dashed var(--border);
  display: flex; flex-direction: column; gap: 8px;
}
.foot-stat { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary); }
.fs-dot { width: 7px; height: 7px; border-radius: 50%; }

/* ===== 内容区 ===== */
.content { flex: 1; min-width: 0; }
.panel-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; flex-wrap: wrap; margin-bottom: 18px;
}
.panel-title { font-size: 22px; font-weight: 800; color: var(--terra-deep); }
.panel-sub { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
.btn { display: inline-flex; align-items: center; gap: 7px; padding: 10px 17px; border-radius: 13px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.3s, box-shadow 0.3s; }
.btn.primary { background: linear-gradient(135deg, var(--terracotta), #D3A98B); color: #FFF9F2; box-shadow: 0 8px 20px rgba(200, 159, 133, 0.4); }
.btn.ghost { background: rgba(255, 253, 250, 0.85); color: var(--terra-deep); border: 1.5px solid var(--border); }
.btn:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(200, 159, 133, 0.3); }

/* ===== 响应式 ===== */
@media (max-width: 960px) {
  .layout { flex-direction: column; }
  .sidebar { width: 100%; position: static; }
  .sb-nav { flex-direction: row; overflow-x: auto; }
  .sb-item { flex-direction: column; text-align: center; min-width: 90px; gap: 6px; }
  .sb-item.active::before { left: 50%; top: 0; transform: translateX(-50%); width: 22px; height: 3px; border-radius: 0 0 3px 3px; }
  .sb-desc, .sb-foot, .sb-head { display: none; }
}
@media (max-width: 600px) {
  .panel-title { font-size: 18px; }
}
</style>
