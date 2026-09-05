<template>
  <div class="reminder-layout">
    <!-- 左侧导航栏 -->
    <aside class="reminder-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-title">家庭提醒</div>
      </div>

      <nav class="sidebar-nav">
        <div
          v-for="item in navItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeView === item.key }"
          @click="switchView(item.key)"
        >
          <div class="nav-icon" :style="{ color: item.color }">
            <el-icon :size="20"><component :is="item.icon" /></el-icon>
          </div>
          <div class="nav-info">
            <div class="nav-label">{{ item.label }}</div>
            <div class="nav-desc">{{ item.desc }}</div>
          </div>
          <div v-if="item.badge" class="nav-badge">{{ item.badge }}</div>
        </div>
      </nav>

      <!-- 底部统计 -->
      <div class="sidebar-footer">
        <div class="footer-stat">
          <span class="stat-dot" style="background:#10b981;"></span>
          <span>{{ todoStats.pending }} 待办</span>
        </div>
        <div class="footer-stat">
          <span class="stat-dot" style="background:#f59e0b;"></span>
          <span>{{ todoStats.overdue }} 过期</span>
        </div>
      </div>
    </aside>

    <!-- 右侧内容区 -->
    <main class="reminder-content">
      <router-view v-slot="{ Component }">
        <transition name="content-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { todoApi, anniversaryApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { List, Calendar, Star } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeView = ref('todo')
const todoStats = ref({ pending: 0, overdue: 0 })
const annivCount = ref(0)

const navItems = computed(() => [
  {
    key: 'todo',
    label: '清单',
    desc: '待办事项管理',
    icon: 'List',
    color: '#667eea',
    badge: todoStats.value.pending > 0 ? todoStats.value.pending : null
  },
  {
    key: 'calendar',
    label: '日历视图',
    desc: '日程一览',
    icon: 'Calendar',
    color: '#10b981',
    badge: null
  },
  {
    key: 'anniversary',
    label: '纪念日',
    desc: '重要日期提醒',
    icon: 'Star',
    color: '#f59e0b',
    badge: annivCount.value > 0 ? annivCount.value : null
  }
])

// 根据当前路由路径判断活跃视图
function updateActiveView() {
  const path = route.path
  if (path.includes('/reminder/todo')) activeView.value = 'todo'
  else if (path.includes('/reminder/calendar')) activeView.value = 'calendar'
  else if (path.includes('/reminder/anniversary')) activeView.value = 'anniversary'
}

function switchView(key) {
  activeView.value = key
  router.push(`/reminder/${key}`)
}

onMounted(async () => {
  updateActiveView()
  loadStats()
})

watch(() => route.path, () => {
  updateActiveView()
})

async function loadStats() {
  try {
    const familyId = authStore.currentFamily?.id
    if (!familyId) return
    const [todoRes, annivRes] = await Promise.all([
      todoApi.getStats({ familyId }),
      anniversaryApi.getList({ familyId })
    ])
    todoStats.value = {
      pending: todoRes.data?.pending || 0,
      overdue: todoRes.data?.overdue || 0
    }
    annivCount.value = annivRes.data?.length || 0
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
.reminder-layout {
  display: flex;
  gap: 0;
  min-height: calc(100vh - 100px);
  animation: pageIn 0.4s ease-out;
}

@keyframes pageIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== 左侧导航栏 ========== */
.reminder-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 20px 20px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.5px;
}

/* 导航项 */
.sidebar-nav {
  flex: 1;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}

.nav-item:hover {
  background: rgba(102, 126, 234, 0.06);
}

.nav-item.active {
  background: rgba(102, 126, 234, 0.1);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.12);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: linear-gradient(180deg, #667eea, #764ba2);
  border-radius: 0 3px 3px 0;
}

.nav-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.03);
  flex-shrink: 0;
  transition: all 0.25s;
}

.nav-item.active .nav-icon {
  background: rgba(102, 126, 234, 0.12);
}

.nav-info {
  flex: 1;
  min-width: 0;
}

.nav-label {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
}

.nav-desc {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
  line-height: 1.3;
}

.nav-badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 22px;
  text-align: center;
  line-height: 1.4;
}

/* 底部统计 */
.sidebar-footer {
  padding: 14px 20px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
}

.stat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ========== 右侧内容区 ========== */
.reminder-content {
  flex: 1;
  min-width: 0;
  margin-left: 16px;
  background: transparent;
}

/* 内容切换动画 */
.content-fade-enter-active,
.content-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.content-fade-enter-from {
  opacity: 0;
  transform: translateX(8px);
}

.content-fade-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .reminder-layout {
    flex-direction: column;
    min-height: auto;
  }

  .reminder-sidebar {
    width: 100%;
    border-radius: 16px;
    margin-bottom: 12px;
  }

  .sidebar-header {
    display: none;
  }

  .sidebar-nav {
    flex-direction: row;
    padding: 8px;
    gap: 6px;
    overflow-x: auto;
  }

  .nav-item {
    flex-direction: column;
    gap: 4px;
    padding: 10px 16px;
    min-width: 80px;
    text-align: center;
  }

  .nav-item.active::before {
    left: 50%;
    top: 0;
    transform: translateX(-50%);
    width: 20px;
    height: 3px;
    border-radius: 0 0 3px 3px;
  }

  .nav-icon {
    width: 32px;
    height: 32px;
  }

  .nav-desc {
    display: none;
  }

  .nav-label {
    font-size: 12px;
  }

  .sidebar-footer {
    display: none;
  }

  .reminder-content {
    margin-left: 0;
  }
}
</style>
