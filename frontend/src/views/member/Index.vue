<template>
  <div>
    <div class="page-head">
      <div>
        <div class="page-title">🗂 家庭档案</div>
        <div class="page-sub">记录每一位家人的成长、喜好与心情，把日子存成一本翻得动的册子</div>
      </div>
      <div class="head-actions">
        <button class="btn-ghost" @click="openProfileForm()">＋ 添加成员</button>
      </div>
    </div>

    <div class="subtabs">
      <button v-for="t in tabs" :key="t.key" class="subtab" :class="{ active: activeTab === t.key }" @click="activeTab = t.key">{{ t.icon }} {{ t.label }}</button>
    </div>

    <!-- ===== 身份卡 ===== -->
    <section v-show="activeTab === 'id'">
      <div class="mem-chips">
        <button v-for="p in profiles" :key="p.id" class="mem-chip" :class="{ active: curProfile?.id === p.id }" @click="curProfile = p">
          <span class="mav" :style="{ background: getProfileBg(p) }">{{ (p.nickname || p.name || '?')[0] }}</span>
          {{ p.nickname || p.name }}
        </button>
      </div>
      <div v-if="!curProfile" class="card empty-card"><p>还没有成员，点击右上角添加</p></div>
      <div v-else>
      <div style="display:flex;gap:8px;margin-bottom:14px;">
        <button class="btn-ghost" @click="openProfileForm(curProfile)">✏️ 编辑成员</button>
        <button class="btn-ghost" style="color:#B06A6A;" @click="deleteProfile(curProfile.id, curProfile.name)">🗑 删除成员</button>
      </div>
      <div class="id-layout">
        <div class="card id-card">
          <div class="id-ava" :style="{ background: getProfileBg(curProfile) }">{{ (curProfile.nickname || curProfile.name || '?')[0] }}</div>
          <div class="id-name">{{ curProfile.name }}</div>
          <div v-if="curProfile.nickname" class="id-nick">昵称 · {{ curProfile.nickname }}</div>
          <div class="id-pills">
            <span v-if="zodiacInfo" class="pill">{{ zodiacInfo.emo }} {{ zodiacInfo.name }}座</span>
            <span v-if="curProfile.bloodType" class="pill b">🩸 {{ curProfile.bloodType }}型</span>
            <span v-if="curProfile.mbti" class="pill p">🧠 {{ curProfile.mbti }}</span>
          </div>
          <div class="id-mini">
            <div class="im"><b>{{ profileAge }}</b><span>岁</span></div>
            <div class="im"><b>{{ latestWeight || '-' }}</b><span>kg 体重</span></div>
            <div class="im"><b>{{ curProfile.height || '-' }}</b><span>cm 身高</span></div>
          </div>
          <div v-if="curProfile.birthday" class="bd-box">
            <div class="bd-head"><span class="bd-lbl">🎂 生日</span></div>
            <div class="bd-value">{{ formatBirthday(curProfile.birthday) }}</div>
          </div>
        </div>
        <div class="id-right">
          <div class="card sec-card">
            <div class="sec-title"><span class="ti" style="background:linear-gradient(135deg,var(--rose),var(--rose-d));">⚠️</span>过敏源 & 忌口</div>
            <div class="sec-sub">家庭聚餐规划必查 · 点菜前先看一眼这里</div>
            <div class="alg-group">
              <div class="alg-lbl">过敏源</div>
              <div class="alg-chips">
                <span v-for="a in parseJson(curProfile.allergies)" :key="a" class="alg allergy">⚠ {{ a }}</span>
                <span v-if="!parseJson(curProfile.allergies).length" class="alg-empty">暂无记录</span>
              </div>
            </div>
            <div class="alg-group">
              <div class="alg-lbl">忌口 / 不吃</div>
              <div class="alg-chips">
                <span v-for="a in parseJson(curProfile.dislikedFoods)" :key="a" class="alg avoid">🚫 {{ a }}</span>
                <span v-if="!parseJson(curProfile.dislikedFoods).length" class="alg-empty">暂无记录</span>
              </div>
            </div>
          </div>
          <div class="card sec-card">
            <div class="sec-title"><span class="ti" style="background:linear-gradient(135deg,var(--sage),var(--sage-d));">🥗</span>偏好与爱好</div>
            <div class="sec-sub">爱吃的食物和兴趣爱好</div>
            <div class="alg-group">
              <div class="alg-lbl">爱吃的食物</div>
              <div class="pref-tags">
                <span v-for="f in parseJson(curProfile.favoriteFoods)" :key="f" class="ptag love">{{ f }}</span>
              </div>
            </div>
            <div class="alg-group">
              <div class="alg-lbl">兴趣爱好</div>
              <div class="pref-tags">
                <span v-for="h in parseJson(curProfile.hobbies)" :key="h" class="ptag hobby">{{ h }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 身高体重曲线 -->
      <div class="card chart-section">
        <div class="chart-head">
          <div class="chart-title">📈 身高体重记录</div>
          <div class="chart-tabs">
            <button class="chart-tab" :class="{ active: chartType === 'weight' }" @click="chartType = 'weight'; renderChart()">体重</button>
            <button class="chart-tab" :class="{ active: chartType === 'height' }" @click="chartType = 'height'; renderChart()">身高</button>
          </div>
        </div>
        <div ref="chartRef" class="chart-container"></div>
        <div v-if="!profileRecords.weight.length && !profileRecords.height.length" class="chart-empty">暂无记录，添加成员后可记录身高体重</div>
      </div>
      </div>
    </section>

    <!-- ===== 时间轴 ===== -->
    <section v-show="activeTab === 'timeline'">
      <div class="panel-head">
        <div class="chips">
          <button class="chip" :class="{ active: tlFilter === 'all' }" @click="tlFilter = 'all'">全部</button>
          <button v-for="p in profiles" :key="p.id" class="chip" :class="{ active: tlFilter === String(p.id) }" @click="tlFilter = String(p.id)">{{ p.nickname || p.name }}</button>
        </div>
        <button class="btn-primary btn-sm" @click="openTimelineForm()">＋ 添加节点</button>
      </div>
      <div class="timeline">
        <div v-for="ev in filteredTimeline" :key="ev.id" class="tl-node">
          <div class="tl-dot" :style="{ '--c': getTimelineColor(ev) }"></div>
          <div class="card tl-card">
            <div class="tl-top">
              <span class="tl-y" :style="{ background: getTimelineColor(ev) }">{{ ev.year }}</span>
              <span class="tl-ico">{{ ev.icon || '🎉' }}</span>
              <span class="tl-title">{{ ev.title }}</span>
              <span v-if="ev.profile" class="tl-who">{{ ev.profile.nickname || ev.profile.name }}</span>
            </div>
            <div v-if="ev.description" class="tl-desc">{{ ev.description }}</div>
            <div class="tl-date">{{ ev.year }}年{{ ev.month || 1 }}月 · <a class="tl-del" @click.stop="deleteTimeline(ev.id)">删除</a></div>
          </div>
        </div>
        <div v-if="filteredTimeline.length === 0" class="card empty-card"><p>还没有时间轴节点</p></div>
      </div>
    </section>

    <!-- ===== 说明书库 ===== -->
    <section v-show="activeTab === 'manual'">
      <div v-if="manualAlerts.length" class="card alert-card">
        <div class="alert-ai">⚠️</div>
        <div style="flex:1;">
          <div class="alert-title">保修提醒 · {{ manualAlerts.length }} 件需要留意</div>
          <div class="alert-list">
            <div v-for="m in manualAlerts" :key="m.id" class="alert-row">
              <span>🔧 {{ m.name }}</span>
              <span class="alert-date" :class="{ warn: getWarrantyDays(m.warrantyEnd) > 0 }">{{ getWarrantyText(m.warrantyEnd) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="filter-bar">
        <div class="search-wrap"><span class="search-icon">🔍</span><input v-model="manualKeyword" class="search-input" placeholder="搜说明书，如：洗衣机..." /></div>
        <div class="chips">
          <button v-for="c in manualCats" :key="c" class="chip" :class="{ active: manualCatFilter === c }" @click="manualCatFilter = c">{{ c }}</button>
        </div>
        <button class="btn-primary btn-sm" style="margin-left:auto;" @click="openManualForm()">＋ 归档说明书</button>
      </div>
      <div class="mn-grid">
        <div v-for="m in filteredManuals" :key="m.id" class="card mn-card">
          <div class="mn-top"><div class="mn-ico" :style="{ background: getManualBg(m.category) }">{{ getManualEmoji(m.category) }}</div><span class="mn-badge" :class="getWarrantyClass(m.warrantyEnd)">{{ getWarrantyText(m.warrantyEnd) }}</span></div>
          <div class="mn-name">{{ m.name }}</div>
          <div class="mn-model">{{ m.modelNo || '未填型号' }}</div>
          <div class="mn-meta">购买 {{ m.purchaseDate || '-' }} · 保修至 {{ m.warrantyEnd || '-' }} · <a class="tl-del" @click.stop="deleteManual(m.id, m.name)">删除</a></div>
        </div>
        <div v-if="filteredManuals.length === 0" class="card empty-card"><p>还没有归档说明书</p></div>
      </div>
    </section>

    <!-- ===== 宠物档案 ===== -->
    <section v-show="activeTab === 'pet'">
      <div class="mem-chips">
        <button v-for="p in pets" :key="p.id" class="mem-chip" :class="{ active: curPet?.id === p.id }" @click="curPet = p">
          <span class="mav" :style="{ background: 'rgba(232,179,106,.3)' }">{{ p.emoji || '🐾' }}</span>
          {{ p.name }}
        </button>
        <button class="mem-chip" @click="openPetForm()"><span class="mav" style="background:rgba(200,159,133,.15);">＋</span> 添加宠物</button>
      </div>
      <div v-if="!curPet" class="card empty-card"><p>还没有宠物档案</p></div>
      <div v-else>
      <div style="display:flex;gap:8px;margin-bottom:14px;">
        <button class="btn-ghost" @click="openPetForm(curPet)">✏️ 编辑</button>
        <button class="btn-ghost" style="color:#B06A6A;" @click="deletePet(curPet.id, curPet.name)">🗑 删除</button>
      </div>
        <div class="pet-grid">
          <div class="card pet-card">
            <div class="pet-ava" :style="{ background: 'linear-gradient(135deg,rgba(232,179,106,.35),rgba(232,179,106,.12))' }">{{ curPet.emoji || '🐱' }}</div>
            <div class="pet-name">{{ curPet.name }}</div>
            <div class="pet-breed">{{ curPet.breed || '-' }}</div>
            <div class="pet-pills">
              <span v-for="p in (curPet.pills || [])" :key="p" class="pill">{{ p }}</span>
            </div>
            <div class="pet-w"><b>{{ curPet.weight || '-' }}</b><span> kg 当前体重</span><span v-if="curPet.weightChange" class="w-change" :class="curPet.weightChange?.startsWith('+') ? 'up' : 'down'">{{ curPet.weightChange }}</span></div>
          </div>
          <div class="card sec-card">
            <div class="sec-title"><span class="ti" style="background:linear-gradient(135deg,var(--amber),var(--amber-d));">🍗</span>饮食偏好</div>
            <div class="sec-sub">买粮买零食前先看这张清单</div>
            <div class="alg-group"><div class="alg-lbl">爱吃</div><div class="pref-tags"><span v-for="l in (curPet.loves || [])" :key="l" class="ptag love">{{ l }}</span></div></div>
            <div class="alg-group"><div class="alg-lbl">挑食 / 不吃</div><div class="pref-tags"><span v-for="h in (curPet.hates || [])" :key="h" class="ptag hobby">{{ h }}</span></div></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 成就墙 ===== -->
    <section v-show="activeTab === 'achieve'">
      <div class="aw-stats">
        <div class="card stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,var(--amber),#C08A3E);">🏅</div><div class="stat-num" style="color:#C08A3E;">{{ achievements.length }}</div><div class="stat-lbl">成就总数</div></div>
        <div class="card stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,var(--sage),#7E8862);">🌟</div><div class="stat-num" style="color:#7E8862;">{{ yearAchievements }}</div><div class="stat-lbl">今年新增</div></div>
        <div class="card stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,var(--rose),#B06A6A);">👑</div><div class="stat-num" style="color:#B06A6A;font-size:20px;">{{ topAchiever }}</div><div class="stat-lbl">成就最多</div></div>
      </div>
      <div class="panel-head">
        <div class="sec-sub" style="margin:0;">不只是奖状 —— 学会骑车、坚持跑步 100 天，都值得被记住</div>
        <button class="btn-primary btn-sm" @click="openAchievementForm()">＋ 记一笔成就</button>
      </div>
      <div class="aw-grid">
        <div v-for="a in achievements" :key="a.id" class="card aw-card" :class="{ gold: a.isGold }">
          <div class="aw-top">
            <div class="aw-medal" :style="{ background: a.isGold ? 'rgba(232,179,106,.25)' : 'rgba(237,224,206,.8)' }">{{ a.icon || '🎉' }}</div>
            <span class="aw-cat">{{ a.category || '生活' }}</span>
          </div>
          <div class="aw-title">{{ a.title }}</div>
          <div v-if="a.description" class="aw-desc">{{ a.description }}</div>
          <div class="aw-foot">
            <span class="aw-who">{{ a.profile?.nickname || a.profile?.name || '-' }}</span>
            <span class="aw-date">{{ a.achievedDate }}</span>
            <a class="tl-del" @click.stop="deleteAchievement(a.id)">删除</a>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 情绪温度计 ===== -->
    <section v-show="activeTab === 'mood'">
      <div class="mood-grid">
        <div class="card ck-card">
          <div class="sec-title"><span class="ti" style="background:linear-gradient(135deg,var(--amber),#C08A3E);">🌡</span>今日心情打卡</div>
          <div class="ck-date">{{ todayStr }}</div>
          <div class="mood-row">
            <button v-for="(m, i) in moods" :key="i" class="mood-btn" :class="{ active: moodSel === i }" @click="moodSel = i">
              <span class="me">{{ m.e }}</span><span class="ml">{{ m.l }}</span>
            </button>
          </div>
          <div class="mtags">
            <button v-for="t in moodTags" :key="t" class="mtag" :class="{ active: activeMoodTags.has(t) }" @click="toggleMoodTag(t)">{{ t }}</button>
          </div>
          <textarea v-model="moodNote" class="ck-note" rows="2" placeholder="今天发生了什么？写一句给自己或家人..."></textarea>
          <button class="btn-primary" style="width:100%;justify-content:center;margin-top:12px;" @click="submitMood">💛 完成今日打卡</button>
          <div class="thermo-wrap">
            <div class="thermo"><div class="fill" :style="{ height: Math.max(8, Math.min(100, todayScore)) + '%', background: thermoColor(todayScore) }"></div><div class="bulb"></div></div>
            <div class="th-info"><b>{{ todayScore }}</b><div class="th-word">{{ thermoWord(todayScore) }}</div><div class="th-sub">今日家庭情绪指数</div></div>
          </div>
        </div>
        <div class="card chart-card">
          <div class="chart-head"><div class="chart-title">💗 家庭情绪曲线 · 近 7 天</div></div>
          <div class="mood-chart-placeholder">📈 打卡后显示趋势</div>
        </div>
      </div>
    </section>

    <!-- 表单弹窗 -->
    <el-dialog v-model="showForm" :title="formTitle" width="520px" class="warm-dialog">
      <el-form :model="formData" label-width="90px" class="warm-form">
        <template v-if="formType === 'profile'">
          <el-form-item label="姓名"><el-input v-model="formData.name" placeholder="真实姓名" /></el-form-item>
          <el-form-item label="昵称"><el-input v-model="formData.nickname" placeholder="家人怎么叫你" /></el-form-item>
          <el-row :gutter="12">
            <el-col :span="12"><el-form-item label="性别"><el-select v-model="formData.gender" style="width:100%"><el-option label="男" value="male" /><el-option label="女" value="female" /></el-select></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="生日"><el-date-picker v-model="formData.birthday" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="12">
            <el-col :span="8"><el-form-item label="身高(cm)"><el-input-number v-model="formData.height" :min="0" style="width:100%" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="血型"><el-select v-model="formData.bloodType" style="width:100%"><el-option v-for="b in ['A','B','AB','O']" :key="b" :label="b" :value="b" /></el-select></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="MBTI"><el-input v-model="formData.mbti" placeholder="如：ISTJ" /></el-form-item></el-col>
          </el-row>
          <el-form-item label="过敏源"><el-input v-model="formData.allergiesStr" placeholder="用逗号分隔" /></el-form-item>
          <el-form-item label="忌口"><el-input v-model="formData.dislikedFoodsStr" placeholder="用逗号分隔" /></el-form-item>
          <el-form-item label="爱吃的食物"><el-input v-model="formData.favoriteFoodsStr" placeholder="用逗号分隔" /></el-form-item>
          <el-form-item label="兴趣爱好"><el-input v-model="formData.hobbiesStr" placeholder="用逗号分隔" /></el-form-item>
          <el-form-item label="备注"><el-input v-model="formData.notes" type="textarea" :rows="2" /></el-form-item>
        </template>
        <template v-if="formType === 'timeline'">
          <el-row :gutter="12">
            <el-col :span="8"><el-form-item label="年份"><el-input-number v-model="formData.year" style="width:100%" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="月份"><el-input-number v-model="formData.month" :min="1" :max="12" style="width:100%" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="图标"><el-input v-model="formData.icon" placeholder="🎉" /></el-form-item></el-col>
          </el-row>
          <el-form-item label="标题"><el-input v-model="formData.title" placeholder="如：小雨第一次登台演出" /></el-form-item>
          <el-form-item label="属于谁"><el-select v-model="formData.profileId" style="width:100%" clearable><el-option label="全家" :value="null" /><el-option v-for="p in profiles" :key="p.id" :label="p.nickname || p.name" :value="p.id" /></el-select></el-form-item>
          <el-form-item label="描述"><el-input v-model="formData.description" type="textarea" :rows="2" placeholder="那天发生了什么？" /></el-form-item>
        </template>
        <template v-if="formType === 'manual'">
          <el-form-item label="物品名称"><el-input v-model="formData.name" placeholder="如：空气净化器" /></el-form-item>
          <el-form-item label="品牌型号"><el-input v-model="formData.modelNo" placeholder="如：小米 · 4 Pro" /></el-form-item>
          <el-form-item label="分类"><el-select v-model="formData.category" style="width:100%"><el-option v-for="c in manualCats.slice(1)" :key="c" :label="c" :value="c" /></el-select></el-form-item>
          <el-row :gutter="12">
            <el-col :span="12"><el-form-item label="购买日期"><el-date-picker v-model="formData.purchaseDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="保修期(月)"><el-input-number v-model="formData.warrantyMonths" :min="0" style="width:100%" /></el-form-item></el-col>
          </el-row>
        </template>
        <template v-if="formType === 'pet'">
          <el-row :gutter="12">
            <el-col :span="12"><el-form-item label="宠物名"><el-input v-model="formData.name" placeholder="如：橘子" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="图标"><el-input v-model="formData.emoji" placeholder="🐱" /></el-form-item></el-col>
          </el-row>
          <el-form-item label="品种"><el-input v-model="formData.breed" placeholder="如：中华田园猫" /></el-form-item>
          <el-row :gutter="12">
            <el-col :span="12"><el-form-item label="体重(kg)"><el-input-number v-model="formData.weight" :min="0" :precision="1" style="width:100%" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="生日"><el-date-picker v-model="formData.birthday" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col>
          </el-row>
          <el-form-item label="标签"><el-input v-model="formData.pillsStr" placeholder="用逗号分隔，如：已绝育,已植芯片" /></el-form-item>
          <el-form-item label="爱吃"><el-input v-model="formData.lovesStr" placeholder="用逗号分隔" /></el-form-item>
          <el-form-item label="不吃"><el-input v-model="formData.hatesStr" placeholder="用逗号分隔" /></el-form-item>
        </template>
        <template v-if="formType === 'achievement'">
          <el-form-item label="成就标题"><el-input v-model="formData.title" placeholder="如：坚持早睡 21 天" /></el-form-item>
          <el-form-item label="属于谁"><el-select v-model="formData.profileId" style="width:100%" clearable><el-option v-for="p in profiles" :key="p.id" :label="p.nickname || p.name" :value="p.id" /></el-select></el-form-item>
          <el-row :gutter="12">
            <el-col :span="12"><el-form-item label="日期"><el-date-picker v-model="formData.achievedDate" type="month" value-format="YYYY-MM" style="width:100%" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="分类"><el-input v-model="formData.category" placeholder="如：运动、学习" /></el-form-item></el-col>
          </el-row>
          <el-form-item label="小故事"><el-input v-model="formData.description" type="textarea" :rows="2" placeholder="为什么值得记住？" /></el-form-item>
        </template>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showForm = false">取消</button>
          <button class="btn-confirm" @click="handleSave">{{ editingId ? '更新' : '保存' }}</button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { memberProfileApi, petApi, achievementApi, moodRecordApi, timelineEventApi, manualApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const familyId = computed(() => authStore.currentFamily?.id)
const activeTab = ref('id')

const tabs = [
  { key: 'id', icon: '🪪', label: '身份卡' },
  { key: 'timeline', icon: '🌱', label: '人生时间轴' },
  { key: 'manual', icon: '📖', label: '说明书库' },
  { key: 'pet', icon: '🐾', label: '宠物档案' },
  { key: 'achieve', icon: '🏅', label: '成就墙' },
  { key: 'mood', icon: '🌡', label: '情绪温度计' }
]

// ===== 身份卡 =====
const profiles = ref([])
const curProfile = ref(null)
const chartRef = ref(null)
const chartType = ref('weight')
const profileRecords = reactive({ weight: [], height: [] })
let chartInstance = null

const profileBgs = [
  'linear-gradient(135deg,var(--terracotta),var(--terra-deep))',
  'linear-gradient(135deg,var(--rose),#B06A6A)',
  'linear-gradient(135deg,var(--amber),#C08A3E)',
  'linear-gradient(135deg,var(--sky),#6E8CA0)'
]
function getProfileBg(p) { return profileBgs[(p.id || 0) % profileBgs.length] }
function parseJson(v) { try { return typeof v === 'string' ? JSON.parse(v) : (v || []) } catch { return [] } }

const ZN = ['摩羯','水瓶','双鱼','白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手']
const ZE = ['♑','♒','♓','♈','♉','♊','♋','♌','♍','♎','♏','♐']
const ZD = [20,19,21,20,21,22,23,23,23,24,23,22]
const zodiacInfo = computed(() => {
  if (!curProfile.value?.birthday) return null
  const p = curProfile.value.birthday.split('-').map(Number)
  const m = p[1], d = p[2]
  const i = d >= ZD[m-1] ? m % 12 : (m+11) % 12
  return { name: ZN[i], emo: ZE[i] }
})
const profileAge = computed(() => {
  if (!curProfile.value?.birthday) return '-'
  return dayjs().diff(dayjs(curProfile.value.birthday), 'year')
})
const latestWeight = computed(() => {
  const w = curProfile.value?.WeightRecords?.[0]?.weight
  return w ? parseFloat(w).toFixed(1) : null
})
function formatBirthday(d) { return d ? dayjs(d).format('YYYY年M月D日') : '-' }

async function loadProfiles() {
  const res = await memberProfileApi.getList({ familyId: familyId.value })
  profiles.value = res.data
  if (profiles.value.length && !curProfile.value) {
    curProfile.value = profiles.value[0]
    loadProfileDetail(curProfile.value.id)
  }
}

async function loadProfileDetail(id) {
  try {
    const res = await memberProfileApi.getOne(id)
    const data = res.data
    profileRecords.weight = (data.WeightRecords || []).map(r => ({ date: r.recordDate, value: parseFloat(r.weight) })).reverse()
    profileRecords.height = (data.HeightRecords || []).map(r => ({ date: r.recordDate, value: parseFloat(r.height) })).reverse()
    // 更新当前档案的体重
    if (curProfile.value?.id === id) {
      curProfile.value.WeightRecords = data.WeightRecords
    }
    nextTick(renderChart)
  } catch (e) { console.error(e) }
}

function renderChart() {
  if (!chartRef.value) return
  if (!chartInstance) chartInstance = echarts.init(chartRef.value)
  const records = chartType.value === 'weight' ? profileRecords.weight : profileRecords.height
  const unit = chartType.value === 'weight' ? 'kg' : 'cm'
  const color = chartType.value === 'weight' ? '#C89F85' : '#9FB8C9'

  if (!records.length) {
    chartInstance.clear()
    return
  }

  const labels = records.map(r => dayjs(r.date).format('M月D日'))
  const values = records.map(r => r.value)

  chartInstance.setOption({
    tooltip: { trigger: 'axis', formatter: p => `${p[0].axisValue}<br/>${p[0].marker} ${p[0].value} ${unit}` },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#E2CDB2' } }, axisLabel: { color: '#A08D7A', fontSize: 11 } },
    yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: 'rgba(226,205,178,.3)' } }, axisLabel: { color: '#A08D7A', fontSize: 11 } },
    series: [{
      type: 'line',
      data: values,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color, width: 3 },
      itemStyle: { color, borderColor: '#fff', borderWidth: 2 },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: color + '40' },
        { offset: 1, color: color + '08' }
      ]) }
    }]
  })
}

// 切换成员时加载详情
watch(curProfile, (p) => { if (p?.id) loadProfileDetail(p.id) })

// ===== 时间轴 =====
const timeline = ref([])
const tlFilter = ref('all')
const filteredTimeline = computed(() => {
  let list = [...timeline.value].sort((a, b) => (a.year - b.year) || ((a.month || 0) - (b.month || 0)))
  if (tlFilter.value !== 'all') {
    const pid = parseInt(tlFilter.value)
    list = list.filter(e => !e.profileId || e.profileId === pid)
  }
  return list
})
const timelineColors = ['var(--terracotta)', 'var(--rose)', 'var(--amber)', 'var(--sage)', 'var(--sky)']
function getTimelineColor(ev) { return timelineColors[(ev.profileId || 0) % timelineColors.length] }
async function loadTimeline() { const res = await timelineEventApi.getList({ familyId: familyId.value }); timeline.value = res.data }

// ===== 说明书库 =====
const manuals = ref([])
const manualKeyword = ref('')
const manualCatFilter = ref('all')
const manualCats = ['全部', '大家电', '厨卫', '数码', '清洁', '其他']
const filteredManuals = computed(() => {
  return manuals.value.filter(m => {
    const hitKw = !manualKeyword.value || (m.name + (m.modelNo || '')).toLowerCase().includes(manualKeyword.value.toLowerCase())
    const hitCat = manualCatFilter.value === 'all' || m.category === manualCatFilter.value
    return hitKw && hitCat
  })
})
const manualAlerts = computed(() => {
  return manuals.value.filter(m => m.warrantyEnd && getWarrantyDays(m.warrantyEnd) <= 60).sort((a, b) => getWarrantyDays(a.warrantyEnd) - getWarrantyDays(b.warrantyEnd)).slice(0, 3)
})
function getWarrantyDays(end) { if (!end) return 999; return Math.round((new Date(end) - new Date()) / 86400000) }
function getWarrantyText(end) { const d = getWarrantyDays(end); if (d < 0) return '已过保'; if (d <= 60) return '剩' + d + '天'; return '保修中' }
function getWarrantyClass(end) { const d = getWarrantyDays(end); if (d < 0) return 'exp'; if (d <= 60) return 'warn'; return 'ok' }
const manualBgMap = { '大家电': 'rgba(159,184,201,.2)', '厨卫': 'rgba(232,179,106,.2)', '数码': 'rgba(169,139,176,.2)', '清洁': 'rgba(168,176,138,.2)' }
const manualEmojiMap = { '大家电': '🔌', '厨卫': '🍳', '数码': '📱', '清洁': '🧹' }
function getManualBg(cat) { return manualBgMap[cat] || 'rgba(237,224,206,.8)' }
function getManualEmoji(cat) { return manualEmojiMap[cat] || '📦' }
async function loadManuals() { const res = await manualApi.getList({ familyId: familyId.value }); manuals.value = res.data }

// ===== 宠物 =====
const pets = ref([])
const curPet = ref(null)
async function loadPets() { const res = await petApi.getList({ familyId: familyId.value }); pets.value = res.data; if (pets.value.length && !curPet.value) curPet.value = pets.value[0] }

// ===== 成就 =====
const achievements = ref([])
const yearAchievements = computed(() => achievements.value.filter(a => (a.achievedDate || '').startsWith(String(new Date().getFullYear()))).length)
const topAchiever = computed(() => {
  const cnt = {}
  achievements.value.forEach(a => { const n = a.profile?.nickname || a.profile?.name || '-'; cnt[n] = (cnt[n] || 0) + 1 })
  const mx = Math.max(...Object.values(cnt), 0)
  return Object.keys(cnt).filter(k => cnt[k] === mx).join(' & ') || '—'
})
async function loadAchievements() { const res = await achievementApi.getList({ familyId: familyId.value }); achievements.value = res.data }

// ===== 情绪 =====
const moods = [{ e: '😄', s: 92, l: '超棒' }, { e: '😌', s: 76, l: '舒服' }, { e: '😐', s: 58, l: '一般' }, { e: '😞', s: 38, l: '低落' }, { e: '😫', s: 22, l: '疲惫' }]
const moodTags = ['工作', '学习', '健康', '社交', '天气', '睡眠']
const moodSel = ref(-1)
const activeMoodTags = reactive(new Set())
const moodNote = ref('')
const todayScore = ref(71)
const todayStr = dayjs().format('YYYY年M月D日 · 星期') + '日一二三四五六'[new Date().getDay()]
function toggleMoodTag(t) { activeMoodTags.has(t) ? activeMoodTags.delete(t) : activeMoodTags.add(t) }
function thermoWord(s) { return s >= 80 ? '全家阳光满格' : s >= 65 ? '状态不错' : s >= 45 ? '有点阴天' : '低气压预警' }
function thermoColor(s) { return s >= 80 ? 'linear-gradient(180deg,var(--sage),#7E8862)' : s >= 65 ? 'linear-gradient(180deg,var(--amber),#C08A3E)' : 'linear-gradient(180deg,var(--amber),#B06A6A)' }
async function submitMood() {
  if (moodSel.value < 0) return ElMessage.warning('先选一个今天的心情表情吧')
  await moodRecordApi.create({ familyId: familyId.value, moodIndex: moodSel.value + 1, score: moods[moodSel.value].s, tags: [...activeMoodTags], note: moodNote.value, recordDate: dayjs().format('YYYY-MM-DD') })
  todayScore.value = moods[moodSel.value].s
  ElMessage.success('💛 打卡成功 · 今日心情' + moods[moodSel.value].e)
}

// ===== 表单 =====
const showForm = ref(false)
const formType = ref('')
const formTitle = ref('')
const editingId = ref(null)
const formData = reactive({})

function resetForm() { Object.keys(formData).forEach(k => delete formData[k]); editingId.value = null }

function openProfileForm(p) {
  resetForm(); formType.value = 'profile'
  if (p?.id) {
    editingId.value = p.id; formTitle.value = '✏️ 编辑成员'
    Object.assign(formData, { name: p.name, nickname: p.nickname, gender: p.gender, birthday: p.birthday, height: p.height, bloodType: p.bloodType, mbti: p.mbti, allergiesStr: parseJson(p.allergies).join(','), dislikedFoodsStr: parseJson(p.dislikedFoods).join(','), favoriteFoodsStr: parseJson(p.favoriteFoods).join(','), hobbiesStr: parseJson(p.hobbies).join(','), notes: p.notes })
  } else { formTitle.value = '＋ 添加成员'; Object.assign(formData, { name: '', nickname: '', gender: 'male', birthday: '', height: null, bloodType: '', mbti: '', allergiesStr: '', dislikedFoodsStr: '', favoriteFoodsStr: '', hobbiesStr: '', notes: '' }) }
  showForm.value = true
}

function openTimelineForm() {
  resetForm(); formType.value = 'timeline'; formTitle.value = '🌱 添加时间轴节点'
  Object.assign(formData, { year: new Date().getFullYear(), month: new Date().getMonth() + 1, icon: '🎉', title: '', description: '', profileId: null })
  showForm.value = true
}

function openManualForm() {
  resetForm(); formType.value = 'manual'; formTitle.value = '📖 归档说明书'
  Object.assign(formData, { name: '', modelNo: '', category: '大家电', purchaseDate: dayjs().format('YYYY-MM-DD'), warrantyMonths: 12 })
  showForm.value = true
}

function openPetForm() {
  resetForm(); formType.value = 'pet'; formTitle.value = '🐾 添加宠物'
  Object.assign(formData, { name: '', emoji: '🐱', breed: '', weight: null, birthday: '', pillsStr: '', lovesStr: '', hatesStr: '' })
  showForm.value = true
}

function openAchievementForm() {
  resetForm(); formType.value = 'achievement'; formTitle.value = '🏅 记一笔成就'
  Object.assign(formData, { title: '', profileId: null, achievedDate: dayjs().format('YYYY-MM'), category: '生活', description: '' })
  showForm.value = true
}

function splitStr(s) { return s ? s.split(/[,，]/).map(x => x.trim()).filter(Boolean) : [] }

async function handleSave() {
  const fid = familyId.value
  try {
    if (formType.value === 'profile') {
      const payload = { ...formData, familyId: fid, allergies: splitStr(formData.allergiesStr), dislikedFoods: splitStr(formData.dislikedFoodsStr), favoriteFoods: splitStr(formData.favoriteFoodsStr), hobbies: splitStr(formData.hobbiesStr) }
      if (editingId.value) await memberProfileApi.update(editingId.value, payload)
      else await memberProfileApi.create(payload)
      loadProfiles()
    } else if (formType.value === 'timeline') {
      if (editingId.value) await timelineEventApi.update(editingId.value, formData)
      else await timelineEventApi.create({ ...formData, familyId: fid })
      loadTimeline()
    } else if (formType.value === 'manual') {
      if (editingId.value) await manualApi.update(editingId.value, formData)
      else await manualApi.create({ ...formData, familyId: fid })
      loadManuals()
    } else if (formType.value === 'pet') {
      const payload = { ...formData, familyId: fid, pills: splitStr(formData.pillsStr), loves: splitStr(formData.lovesStr), hates: splitStr(formData.hatesStr) }
      if (editingId.value) await petApi.update(editingId.value, payload)
      else await petApi.create(payload)
      loadPets()
    } else if (formType.value === 'achievement') {
      if (editingId.value) await achievementApi.update(editingId.value, formData)
      else await achievementApi.create({ ...formData, familyId: fid, icon: '🎉' })
      loadAchievements()
    }
    ElMessage.success(editingId.value ? '更新成功' : '保存成功')
    showForm.value = false
  } catch (e) { console.error(e) }
}

// ===== 删除操作 =====
async function deleteProfile(id, name) {
  try { await ElMessageBox.confirm(`确定删除成员「${name}」？`, '确认删除', { type: 'warning' }); await memberProfileApi.remove(id); ElMessage.success('已删除'); loadProfiles() } catch (e) { if (e !== 'cancel') console.error(e) }
}
async function deleteTimeline(id) {
  try { await ElMessageBox.confirm('确定删除此时间轴节点？', '确认删除', { type: 'warning' }); await timelineEventApi.remove(id); ElMessage.success('已删除'); loadTimeline() } catch (e) { if (e !== 'cancel') console.error(e) }
}
async function deleteManual(id, name) {
  try { await ElMessageBox.confirm(`确定删除「${name}」？`, '确认删除', { type: 'warning' }); await manualApi.remove(id); ElMessage.success('已删除'); loadManuals() } catch (e) { if (e !== 'cancel') console.error(e) }
}
async function deletePet(id, name) {
  try { await ElMessageBox.confirm(`确定删除宠物「${name}」？`, '确认删除', { type: 'warning' }); await petApi.remove(id); ElMessage.success('已删除'); loadPets() } catch (e) { if (e !== 'cancel') console.error(e) }
}
async function deleteAchievement(id) {
  try { await ElMessageBox.confirm('确定删除此成就？', '确认删除', { type: 'warning' }); await achievementApi.remove(id); ElMessage.success('已删除'); loadAchievements() } catch (e) { if (e !== 'cancel') console.error(e) }
}

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadProfiles(); loadTimeline(); loadManuals(); loadPets(); loadAchievements()
})
</script>

<style scoped>
/* ===== 页面头部 ===== */
.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.page-sub { margin-top: 6px; font-size: 13.5px; color: var(--text-secondary); }
.head-actions { display: flex; gap: 10px; }
.btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 11px 18px; border-radius: 13px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; background: linear-gradient(135deg, var(--terracotta), #D3A98B); color: #FFF9F2; box-shadow: 0 8px 20px rgba(200,159,133,.4); transition: transform .3s, box-shadow .3s; }
.btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(200,159,133,.3); }
.btn-primary.btn-sm { padding: 8px 14px; font-size: 13px; border-radius: 11px; }
.btn-ghost { display: inline-flex; align-items: center; gap: 7px; padding: 11px 18px; border-radius: 13px; border: 1.5px solid var(--border); cursor: pointer; font-size: 14px; font-weight: 600; background: rgba(255,253,250,.85); color: var(--terra-deep); }

/* ===== 子标签页 ===== */
.subtabs { display: flex; gap: 6px; background: rgba(243,234,221,.6); border: 1px solid var(--border); padding: 5px; border-radius: 16px; margin-bottom: 22px; overflow-x: auto; }
.subtab { padding: 10px 18px; border-radius: 12px; border: none; background: transparent; color: var(--text-secondary); font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all .3s; }
.subtab:hover { color: var(--terra-deep); }
.subtab.active { background: var(--bg-card); color: var(--terra-deep); box-shadow: 0 4px 14px rgba(160,120,90,.14); }

/* ===== 成员切换 ===== */
.mem-chips { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
.mem-chip { display: flex; align-items: center; gap: 9px; padding: 9px 16px 9px 10px; border-radius: 999px; border: 1.5px solid var(--border); background: rgba(255,253,250,.85); cursor: pointer; transition: all .3s; font-size: 14px; font-weight: 600; color: var(--text-secondary); }
.mem-chip .mav { width: 30px; height: 30px; border-radius: 10px; color: #fff; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.mem-chip:hover { transform: translateY(-2px); }
.mem-chip.active { border-color: var(--terracotta); color: var(--terra-deep); box-shadow: 0 6px 18px rgba(200,159,133,.28); background: var(--bg-card); }

/* ===== 身份卡 ===== */
.id-layout { display: grid; grid-template-columns: 340px 1fr; gap: 18px; align-items: start; }
.id-card { padding: 26px 24px; text-align: center; position: relative; overflow: hidden; }
.id-card::before { content: ""; position: absolute; top: -46px; right: -46px; width: 150px; height: 150px; border-radius: 50%; opacity: .14; background: var(--terracotta); }
.id-ava { width: 86px; height: 86px; border-radius: 26px; margin: 0 auto; color: #fff; font-size: 36px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 26px rgba(160,120,90,.3); }
.id-name { font-size: 22px; font-weight: 800; margin-top: 8px; color: var(--terra-deep); }
.id-nick { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
.id-pills { display: flex; justify-content: center; gap: 7px; flex-wrap: wrap; margin-top: 12px; }
.pill { font-size: 12px; font-weight: 600; padding: 4px 11px; border-radius: 999px; background: rgba(168,176,138,.18); color: #7E8862; }
.pill.b { background: rgba(217,154,154,.18); color: #B06A6A; }
.pill.p { background: rgba(169,139,176,.18); color: #8A6B91; }
.id-mini { display: flex; justify-content: center; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--border); }
.im { flex: 1; padding: 8px 4px; border-radius: 14px; background: rgba(243,234,221,.55); }
.im b { display: block; font-size: 19px; font-weight: 800; color: var(--terra-deep); }
.im span { font-size: 11px; color: var(--text-secondary); }
.bd-box { margin-top: 16px; padding: 14px; border-radius: 16px; background: linear-gradient(135deg, rgba(232,179,106,.14), rgba(200,159,133,.1)); border: 1.5px solid rgba(232,179,106,.4); text-align: left; }
.bd-head { display: flex; align-items: center; justify-content: space-between; }
.bd-lbl { font-size: 12.5px; font-weight: 700; color: #C08A3E; }
.bd-value { font-size: 17px; font-weight: 800; color: var(--text-deep); margin-top: 9px; }
.id-right { display: flex; flex-direction: column; gap: 18px; }
.sec-card { padding: 22px; }
.sec-title { display: flex; align-items: center; gap: 9px; font-size: 15.5px; font-weight: 800; color: var(--terra-deep); margin-bottom: 6px; }
.sec-title .ti { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #fff; flex-shrink: 0; }
.sec-sub { font-size: 12px; color: var(--text-secondary); margin-bottom: 14px; }
.alg-group { margin-bottom: 12px; }
.alg-lbl { font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 7px; }
.alg-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.alg { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; padding: 6px 12px; border-radius: 999px; }
.alg.allergy { background: rgba(217,154,154,.18); color: #B06A6A; border: 1px solid rgba(217,154,154,.45); }
.alg.avoid { background: rgba(232,179,106,.16); color: #C08A3E; border: 1px solid rgba(232,179,106,.45); }
.alg-empty { font-size: 12px; color: var(--text-secondary); }
.pref-tags { display: flex; gap: 7px; flex-wrap: wrap; }
.ptag { font-size: 12.5px; font-weight: 600; padding: 5px 12px; border-radius: 999px; }
.ptag.love { background: rgba(168,176,138,.18); color: #7E8862; }
.ptag.hobby { background: rgba(159,184,201,.2); color: #6E8CA0; }

/* ===== 时间轴 ===== */
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.chips { display: flex; gap: 8px; flex-wrap: wrap; }
.chip { padding: 9px 15px; border-radius: 999px; border: 1.5px solid var(--border); background: rgba(255,253,250,.8); color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .25s; }
.chip:hover { border-color: var(--terracotta); color: var(--terra-deep); }
.chip.active { background: var(--terracotta); border-color: var(--terracotta); color: #fff; }
.timeline { position: relative; padding-left: 26px; }
.timeline::before { content: ""; position: absolute; left: 8px; top: 6px; bottom: 6px; width: 2.5px; border-radius: 99px; background: linear-gradient(180deg, var(--terracotta), var(--amber), var(--sage)); opacity: .5; }
.tl-node { position: relative; margin-bottom: 16px; }
.tl-dot { position: absolute; left: -26px; top: 22px; width: 17px; height: 17px; border-radius: 50%; background: var(--c, var(--terracotta)); border: 3.5px solid var(--warm-white); box-shadow: 0 0 0 2px var(--c, var(--terracotta)); }
.tl-card { padding: 16px 18px; transition: transform .3s, box-shadow .3s; }
.tl-card:hover { transform: translateX(5px); box-shadow: 0 12px 30px rgba(160,120,90,.14); }
.tl-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.tl-y { font-size: 12px; font-weight: 800; color: #fff; padding: 2px 10px; border-radius: 999px; }
.tl-ico { font-size: 19px; }
.tl-title { font-size: 15px; font-weight: 700; }
.tl-who { margin-left: auto; font-size: 11.5px; font-weight: 700; padding: 2px 10px; border-radius: 999px; background: var(--apricot); color: var(--terra-deep); }
.tl-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.65; margin-top: 8px; }
.tl-date { font-size: 11.5px; color: var(--text-secondary); margin-top: 8px; opacity: .8; }
.tl-del { color: #B06A6A; cursor: pointer; font-weight: 600; text-decoration: none; }
.tl-del:hover { text-decoration: underline; }
.btn-ghost { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: 11px; border: 1.5px solid var(--border); cursor: pointer; font-size: 13px; font-weight: 600; background: rgba(255,253,250,.85); color: var(--terra-deep); }

/* ===== 身高体重图表 ===== */
.chart-section { padding: 22px; margin-top: 18px; }
.chart-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.chart-title { font-size: 15px; font-weight: 800; color: var(--terra-deep); }
.chart-tabs { display: flex; gap: 4px; background: rgba(243,234,221,.6); border: 1px solid var(--border); padding: 3px; border-radius: 10px; }
.chart-tab { padding: 6px 14px; border-radius: 8px; border: none; background: transparent; color: var(--text-secondary); font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .25s; }
.chart-tab:hover { color: var(--terra-deep); }
.chart-tab.active { background: var(--bg-card); color: var(--terra-deep); box-shadow: 0 2px 8px rgba(160,120,90,.12); }
.chart-container { width: 100%; height: 240px; }
.chart-empty { text-align: center; padding: 30px; color: var(--text-secondary); font-size: 13px; }

/* ===== 说明书库 ===== */
.alert-card { display: flex; align-items: flex-start; gap: 12px; padding: 16px 18px; margin-bottom: 18px; border: 1.5px solid rgba(232,179,106,.5); background: rgba(232,179,106,.12); }
.alert-ai { width: 34px; height: 34px; border-radius: 11px; background: linear-gradient(135deg, var(--amber), #C08A3E); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.alert-title { font-size: 14.5px; font-weight: 700; color: #C08A3E; }
.alert-list { margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
.alert-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 13px; }
.alert-date { font-size: 11.5px; font-weight: 700; padding: 2px 10px; border-radius: 999px; background: rgba(217,154,154,.2); color: #B06A6A; }
.alert-date.warn { background: rgba(232,179,106,.25); color: #C08A3E; }
.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; align-items: center; }
.search-wrap { position: relative; flex: 1; min-width: 180px; max-width: 300px; }
.search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); opacity: .6; font-size: 14px; }
.search-input { width: 100%; padding: 11px 14px 11px 38px; border-radius: 12px; border: 1.5px solid var(--wood-light); background: #FFFDF9; font-size: 13.5px; outline: none; color: var(--text-deep); font-family: inherit; transition: all .3s; }
.search-input:focus { border-color: var(--terracotta); box-shadow: 0 0 0 4px rgba(200,159,133,.14); }
.mn-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.mn-card { padding: 18px; transition: transform .35s, box-shadow .35s; }
.mn-card:hover { transform: translateY(-5px); box-shadow: 0 16px 36px rgba(160,120,90,.16); }
.mn-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
.mn-ico { width: 48px; height: 48px; border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 23px; }
.mn-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
.mn-badge.ok { background: rgba(168,176,138,.2); color: #7E8862; }
.mn-badge.warn { background: rgba(232,179,106,.22); color: #C08A3E; }
.mn-badge.exp { background: rgba(217,154,154,.2); color: #B06A6A; }
.mn-name { font-size: 15px; font-weight: 700; }
.mn-model { font-size: 12px; color: var(--text-secondary); margin-top: 3px; }
.mn-meta { font-size: 11.5px; color: var(--text-secondary); margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border); }

/* ===== 宠物 ===== */
.pet-grid { display: grid; grid-template-columns: 300px 1fr; gap: 18px; align-items: stretch; margin-bottom: 18px; }
.pet-card { padding: 24px; text-align: center; }
.pet-ava { width: 84px; height: 84px; border-radius: 50%; margin: 0 auto; font-size: 42px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 24px rgba(160,120,90,.22); }
.pet-name { font-size: 20px; font-weight: 800; color: var(--terra-deep); margin-top: 10px; }
.pet-breed { font-size: 12.5px; color: var(--text-secondary); margin-top: 3px; }
.pet-pills { display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
.pet-w { margin-top: 16px; padding-top: 14px; border-top: 1px dashed var(--border); }
.pet-w b { font-size: 28px; font-weight: 800; color: var(--terra-deep); }
.pet-w span { font-size: 12px; color: var(--text-secondary); }
.w-change { display: inline-block; margin-left: 8px; font-size: 11.5px; font-weight: 700; padding: 2px 9px; border-radius: 999px; }
.w-change.up { background: rgba(232,179,106,.2); color: #C08A3E; }
.w-change.down { background: rgba(168,176,138,.2); color: #7E8862; }

/* ===== 成就墙 ===== */
.aw-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 18px; }
.stat-card { padding: 20px; text-align: center; position: relative; overflow: hidden; }
.stat-card::after { content: ""; position: absolute; right: -28px; top: -28px; width: 100px; height: 100px; border-radius: 50%; opacity: .14; }
.stat-icon { width: 40px; height: 40px; border-radius: 13px; display: flex; align-items: center; justify-content: center; font-size: 19px; color: #fff; margin: 0 auto 12px; }
.stat-num { font-size: 30px; font-weight: 800; }
.stat-lbl { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
.aw-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.aw-card { padding: 20px; transition: transform .35s, box-shadow .35s; }
.aw-card:hover { transform: translateY(-5px); box-shadow: 0 16px 36px rgba(160,120,90,.16); }
.aw-card.gold { background: linear-gradient(140deg, rgba(232,179,106,.16), var(--bg-card) 55%); border-color: rgba(232,179,106,.55); }
.aw-top { display: flex; align-items: flex-start; justify-content: space-between; }
.aw-medal { width: 46px; height: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.aw-cat { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; background: var(--apricot); color: var(--terra-deep); }
.aw-title { font-size: 15px; font-weight: 700; margin-top: 12px; line-height: 1.45; }
.aw-desc { font-size: 12.5px; color: var(--text-secondary); margin-top: 6px; line-height: 1.6; }
.aw-foot { display: flex; align-items: center; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border); font-size: 11.5px; color: var(--text-secondary); }
.aw-who { font-weight: 700; color: var(--text-deep); }
.aw-date { margin-left: auto; }

/* ===== 情绪温度计 ===== */
.mood-grid { display: grid; grid-template-columns: 360px 1fr; gap: 18px; align-items: start; }
.ck-card { padding: 22px; }
.ck-date { font-size: 12px; color: var(--text-secondary); margin-bottom: 14px; }
.mood-row { display: flex; gap: 8px; justify-content: space-between; }
.mood-btn { flex: 1; border: 1.5px solid var(--border); background: rgba(255,253,250,.8); border-radius: 14px; padding: 10px 2px 8px; cursor: pointer; transition: all .3s; display: flex; flex-direction: column; align-items: center; gap: 5px; }
.mood-btn .me { font-size: 24px; }
.mood-btn .ml { font-size: 10.5px; font-weight: 700; color: var(--text-secondary); }
.mood-btn:hover { transform: translateY(-4px); }
.mood-btn.active { border-color: var(--terracotta); background: linear-gradient(160deg, rgba(232,179,106,.18), rgba(255,253,250,.9)); box-shadow: 0 8px 20px rgba(200,159,133,.28); }
.mood-btn.active .ml { color: var(--terra-deep); }
.mtags { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 14px; }
.mtag { padding: 6px 12px; border-radius: 999px; border: 1.5px solid var(--border); background: rgba(255,253,250,.8); font-size: 12px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all .25s; }
.mtag.active { background: var(--sage); border-color: var(--sage); color: #fff; }
.ck-note { width: 100%; margin-top: 12px; padding: 10px 13px; border-radius: 12px; border: 1.5px solid var(--wood-light); background: #FFFDF9; font-size: 13px; outline: none; resize: none; color: var(--text-deep); font-family: inherit; }
.ck-note:focus { border-color: var(--terracotta); box-shadow: 0 0 0 4px rgba(200,159,133,.14); }
.thermo-wrap { display: flex; align-items: center; gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--border); }
.thermo { width: 26px; height: 120px; border-radius: 999px; background: rgba(243,234,221,.8); border: 1.5px solid var(--border); position: relative; flex-shrink: 0; overflow: hidden; }
.thermo .fill { position: absolute; left: 0; right: 0; bottom: 0; border-radius: 999px; transition: height .9s cubic-bezier(.22,1,.36,1); }
.thermo .bulb { position: absolute; left: 50%; bottom: -2px; transform: translateX(-50%); width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, var(--rose), #B06A6A); box-shadow: 0 4px 12px rgba(176,106,106,.4); }
.th-info b { font-size: 26px; font-weight: 800; color: var(--terra-deep); }
.th-info .th-word { font-size: 13.5px; font-weight: 700; color: #C08A3E; margin-top: 2px; }
.th-info .th-sub { font-size: 11.5px; color: var(--text-secondary); margin-top: 4px; }
.chart-card { padding: 20px 22px; }
.chart-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.chart-title { font-size: 15px; font-weight: 800; color: var(--terra-deep); }
.mood-chart-placeholder { text-align: center; padding: 40px; color: var(--text-secondary); font-size: 14px; }

/* ===== 空状态 ===== */
.empty-card { text-align: center; padding: 60px 20px; }
.empty-card p { color: var(--text-secondary); margin: 0; }

/* ===== 弹窗按钮 ===== */
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
.btn-cancel { padding: 10px 20px; border-radius: 12px; border: 1.5px solid var(--border); background: rgba(255,253,250,.85); color: var(--text-secondary); font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
.btn-confirm { padding: 10px 24px; border-radius: 12px; border: none; background: linear-gradient(135deg, var(--terracotta), #D3A98B); color: #FFF9F2; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 6px 18px rgba(200,159,133,.35); font-family: inherit; }

/* ===== 响应式 ===== */
@media (max-width: 960px) {
  .id-layout, .pet-grid, .mood-grid { grid-template-columns: 1fr; }
  .mn-grid, .aw-grid, .aw-stats { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .page-title { font-size: 22px; }
  .mn-grid, .aw-grid, .aw-stats { grid-template-columns: 1fr; }
  .subtab { padding: 8px 12px; font-size: 13px; }
  .mood-btn { min-width: 60px; }
}
</style>

<!-- 全局弹窗样式 -->
<style>
.warm-dialog .el-dialog { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; box-shadow: 0 20px 60px rgba(160,120,90,.18); overflow: visible; }
.warm-dialog .el-dialog__header { padding: 20px 24px 0; margin: 0; }
.warm-dialog .el-dialog__title { font-size: 18px; font-weight: 700; color: var(--terra-deep); }
.warm-dialog .el-dialog__body { padding: 16px 24px 8px; overflow: visible; }
.warm-dialog .el-dialog__footer { padding: 8px 24px 20px; }
.warm-form .el-form-item__label { color: var(--text-primary); font-weight: 600; font-size: 13px; }
.warm-form .el-input__wrapper, .warm-form .el-textarea__inner { background: #FFFDF9; border: 1.5px solid #E2CDB2; border-radius: 12px; box-shadow: none; }
.warm-form .el-input__wrapper:hover, .warm-form .el-textarea__inner:hover { border-color: #C89F85; }
.warm-form .el-input__wrapper.is-focus, .warm-form .el-textarea__inner:focus { border-color: #C89F85; box-shadow: 0 0 0 3px rgba(200,159,133,.12); }
.warm-form .el-select .el-input__wrapper { background: #FFFDF9; }
</style>
