<template>
  <el-popover placement="bottom-end" :width="240" trigger="click">
    <template #reference>
      <button class="theme-trigger" title="切换主题">
        <span class="theme-trigger-dot" :style="{ background: activeGradient }"></span>
      </button>
    </template>
    <div class="theme-panel">
      <div class="theme-panel-title">选择主题</div>
      <div
        v-for="t in themeList"
        :key="t.key"
        class="theme-option"
        :class="{ active: themeStore.current === t.key }"
        @click="themeStore.set(t.key)"
      >
        <div class="theme-option-dots">
          <span
            v-for="(c, i) in t.colors"
            :key="i"
            :style="{ background: c }"
          ></span>
        </div>
        <div class="theme-option-info">
          <span class="theme-option-name">{{ t.name }}</span>
          <span v-if="themeStore.current === t.key" class="theme-option-check">✓</span>
        </div>
      </div>
    </div>
  </el-popover>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '@/store/theme'

const themeStore = useThemeStore()

const themeList = [
  { key: 'warm', name: '暖居', colors: ['#FBF6EF', '#C89F85', '#96684A', '#A8B08A', '#E8B36A'] },
  { key: 'ocean', name: '海风', colors: ['#F0F7FA', '#4A9BB5', '#2E7A91', '#6DBF9E', '#F0C264'] },
  { key: 'forest', name: '森林', colors: ['#F2F5EE', '#6E9B5A', '#4A7340', '#7DAF68', '#D4B050'] },
  { key: 'twilight', name: '暮光', colors: ['#F4F0F7', '#9478B0', '#6E5288', '#88B08A', '#E0B860'] },
  { key: 'ink', name: '墨韵', colors: ['#1A1A2E', '#E0A87C', '#C08050', '#88C090', '#E8C870'] },
]

const activeGradient = computed(() => {
  const t = themeList.find(t => t.key === themeStore.current)
  return t ? `linear-gradient(135deg, ${t.colors[1]}, ${t.colors[2]})` : ''
})
</script>

<style scoped>
.theme-trigger {
  width: 36px; height: 36px; border-radius: 10px; border: none;
  background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.25s;
}
.theme-trigger:hover { background: var(--hover-overlay); }
.theme-trigger-dot {
  width: 20px; height: 20px; border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: background 0.3s;
}

.theme-panel { padding: 4px 0; }
.theme-panel-title {
  font-size: 12px; font-weight: 600; color: var(--text-muted);
  padding: 0 4px 10px; letter-spacing: 0.06em;
}

.theme-option {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 12px; cursor: pointer;
  transition: all 0.2s;
}
.theme-option:hover { background: var(--hover-overlay); }
.theme-option.active { background: var(--hover-overlay-strong); }

.theme-option-dots {
  display: flex; gap: 3px;
}
.theme-option-dots span {
  width: 18px; height: 18px; border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.06);
}

.theme-option-info {
  flex: 1; display: flex; align-items: center; justify-content: space-between;
}
.theme-option-name {
  font-size: 13px; font-weight: 500; color: var(--text-primary);
}
.theme-option-check {
  font-size: 13px; font-weight: 700; color: var(--primary);
}
</style>
