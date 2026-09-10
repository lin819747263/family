<template>
  <div>
    <!-- 页面头部 -->
    <div class="page-head">
      <div>
        <div class="page-title">🎡 吃喝玩乐</div>
        <div class="page-sub">吃好喝好玩好，把每个普通日子都过得认真一点</div>
      </div>
      <div class="head-actions">
        <button class="btn-ghost" @click="shuffleRecipe">🎲 今天吃啥</button>
        <button class="btn-primary" @click="openRecipeForm()">＋ 记一道菜</button>
      </div>
    </div>

    <!-- 子标签页 -->
    <div class="subtabs">
      <button v-for="t in tabs" :key="t.key" class="subtab" :class="{ active: activeTab === t.key }" @click="activeTab = t.key">{{ t.icon }} {{ t.label }}</button>
    </div>

    <!-- ===== 家常菜谱 ===== -->
    <section v-show="activeTab === 'eat'">
      <div class="filter-bar">
        <button v-for="d in diffOptions" :key="d.value" class="fchip" :class="{ active: recipeFilter === d.value }" @click="recipeFilter = d.value; loadRecipes()">{{ d.label }}</button>
        <span class="filter-count">共 <b>{{ recipeTotal }}</b> 道家常菜</span>
      </div>
      <div v-if="recipeLoading" class="card loading-card"><div class="loading-spinner"></div><p>加载中...</p></div>
      <div v-else-if="loadErrors.recipe" class="card error-card"><p>加载失败，请稍后重试</p><button class="btn-ghost" @click="loadRecipes()">🔄 重试</button></div>
      <div v-else-if="recipes.length === 0" class="card empty-card"><p>还没有菜谱，点击右上角记一道菜</p></div>
      <div v-else class="recipe-grid">
        <div v-for="r in recipes" :key="r.id" class="card recipe-card" @click="viewRecipe(r)">
          <div class="rcov" :style="{ background: getRecipeBg(r.difficulty) }">
            <span class="rcov-emoji">{{ getRecipeEmoji(r) }}</span>
            <span class="diff-badge" :class="r.difficulty">{{ diffLabel[r.difficulty] }}</span>
          </div>
          <div class="rbody">
            <div class="rname">{{ r.name }}</div>
            <div class="rdesc">{{ r.description }}</div>
            <div class="rmeta">
              <span>⏱ {{ r.cookingTime || '-' }}分钟</span>
              <span>👥 {{ r.servings || '-' }}人份</span>
              <span>🥘 {{ (r.ingredients || []).length }}种材料</span>
            </div>
          </div>
          <div class="rview"><span>查看做法</span></div>
          <button class="card-del" @click.stop="deleteItem('recipe', r.id, r.name)">🗑</button>
        </div>
      </div>
    </section>

    <!-- ===== 奶茶收藏 ===== -->
    <section v-show="activeTab === 'drink'">
      <div class="filter-bar">
        <span class="filter-count">🧋 收藏了 <b>{{ drinks.length }}</b> 杯好喝的 · 点 ❤ 标记想再喝</span>
      </div>
      <div v-if="drinkLoading" class="card loading-card"><div class="loading-spinner"></div><p>加载中...</p></div>
      <div v-else-if="loadErrors.drink" class="card error-card"><p>加载失败，请稍后重试</p><button class="btn-ghost" @click="loadDrinks()">🔄 重试</button></div>
      <template v-else>
      <div v-if="drinks.length === 0" class="card empty-card"><p>还没有奶茶收藏，点击下方添加一杯</p></div>
      <div class="drink-grid">
        <div v-for="d in drinks" :key="d.id" class="card drink-card">
          <button class="card-del" @click.stop="deleteItem('drink', d.id, d.name)">🗑</button>
          <div class="dk-top">
            <div class="cup" :style="{ background: getDrinkBg(d.brand) }">{{ getDrinkEmoji(d.brand) }}</div>
            <button class="heart" :class="{ on: d.isFav }" @click="toggleDrinkFav(d)">
              <span class="h">{{ d.isFav ? '❤️' : '🤍' }}</span>
              <span class="n">{{ d.likes || 0 }}</span>
            </button>
          </div>
          <div class="dk-name">{{ d.name }}</div>
          <span class="dk-brand">{{ d.brand || '自製' }}</span>
          <div class="dk-tags">
            <span v-if="d.sugar" class="dk-tag">{{ d.sugar }}</span>
            <span v-if="d.ice" class="dk-tag ice">{{ d.ice }}</span>
          </div>
          <div v-if="d.note" class="dk-note">{{ d.note }}</div>
        </div>
        <div class="card drink-add" @click="openDrinkForm()">
          <span class="plus-icon">＋</span>
          <span>收藏一杯新的</span>
        </div>
      </div>
      </template>
    </section>

    <!-- ===== 打卡小店 ===== -->
    <section v-show="activeTab === 'shop'">
      <div v-if="shopLoading" class="card loading-card"><div class="loading-spinner"></div><p>加载中...</p></div>
      <div v-else-if="loadErrors.shop" class="card error-card"><p>加载失败，请稍后重试</p><button class="btn-ghost" @click="loadShops()">🔄 重试</button></div>
      <template v-else>
      <div v-if="shops.length === 0" class="card empty-card"><p>还没有打卡小店，点击下方添加</p></div>
      <div v-if="shops.length > 0" class="card ck-summary">
        <div class="ck-ico">📍</div>
        <div class="ck-info">
          <div class="ck-text">今年打卡计划 · 已完成 <b>{{ checkedCount }}</b> / {{ shops.length }} 家小店</div>
          <div class="ck-bar"><i :style="{ width: shops.length ? (checkedCount / shops.length * 100) + '%' : '0%' }"></i></div>
        </div>
      </div>
      <div class="shop-list">
        <div v-for="s in shops" :key="s.id" class="card shop-card" :class="{ done: s.checkedIn }">
          <button class="card-del" @click.stop="deleteItem('shop', s.id, s.name)">🗑</button>
          <span class="stamp">已打卡</span>
          <div class="sp-ico" :style="{ background: getShopBg(s.category) }">{{ getShopEmoji(s.category) }}</div>
          <div class="sp-body">
            <div class="sp-name">{{ s.name }}<span class="sp-cat">{{ s.category }}</span></div>
            <div class="sp-addr">📍 {{ s.address || '-' }}</div>
          </div>
          <div class="sp-right">
            <span class="stars">{{ '★'.repeat(s.rating || 5) }}{{ '☆'.repeat(5 - (s.rating || 5)) }}</span>
            <button class="ck-btn" @click="toggleShopCheck(s)">{{ s.checkedIn ? '✓ 已打卡' : '去打卡' }}</button>
          </div>
        </div>
        <div class="card shop-add" @click="openShopForm()"><span>＋ 添加小店</span></div>
      </div>
      </template>
    </section>

    <!-- ===== 出游景点 ===== -->
    <section v-show="activeTab === 'play'">
      <div v-if="placeLoading" class="card loading-card"><div class="loading-spinner"></div><p>加载中...</p></div>
      <div v-else-if="loadErrors.place" class="card error-card"><p>加载失败，请稍后重试</p><button class="btn-ghost" @click="loadPlaces()">🔄 重试</button></div>
      <template v-else>
      <div class="filter-bar">
        <button v-for="s in seasonOptions" :key="s.value" class="fchip" :class="{ active: seasonFilter === s.value }" @click="seasonFilter = s.value; loadPlaces()">{{ s.label }}</button>
        <span class="filter-count">❤ 标记想去的愿望清单</span>
      </div>
      <div v-if="places.length === 0" class="card empty-card"><p>还没有出游景点，点击下方添加</p></div>
      <div class="place-grid">
        <div v-for="p in places" :key="p.id" class="card place-card">
          <button class="card-del" @click.stop="deleteItem('place', p.id, p.name)">🗑</button>
          <div class="scene" :style="{ background: getPlaceBg(p.season) }">
            <span class="scene-emoji">{{ getPlaceEmoji(p.season) }}</span>
            <span class="season-tag">{{ seasonLabel[p.season] }}</span>
            <button class="wish-btn" :class="{ on: p.isWish }" @click="togglePlaceWish(p)">
              <span>{{ p.isWish ? '❤' : '🤍' }}</span>
            </button>
          </div>
          <div class="pbody">
            <div class="pname">{{ p.name }}</div>
            <div class="pwhy">{{ p.description }}</div>
            <div class="pmeta">
              <span v-if="p.distance">🚗 {{ p.distance }}</span>
              <span v-if="p.duration">⏳ {{ p.duration }}</span>
            </div>
            <div class="ptag-row">
              <span v-if="p.fee" class="ptag fee">{{ p.fee }}</span>
              <span v-for="tag in (p.tags || [])" :key="tag" class="ptag">{{ tag }}</span>
            </div>
          </div>
        </div>
        <div class="card place-add" @click="openPlaceForm()"><span>＋ 添加景点</span></div>
      </div>
      </template>
    </section>

    <!-- ===== 时令水果 ===== -->
    <section v-show="activeTab === 'fruit'">
      <div v-if="fruitLoading" class="card loading-card"><div class="loading-spinner"></div><p>加载中...</p></div>
      <div v-else-if="loadErrors.fruit" class="card error-card"><p>加载失败，请稍后重试</p><button class="btn-ghost" @click="loadFruits()">🔄 重试</button></div>
      <template v-else>
      <div class="card fruit-banner">
        <div class="fb-ico">🍑</div>
        <div class="fb-text">现在是 <b>{{ currentMonth }} 月</b> · 当季水果最新鲜，错过又要等一年。</div>
      </div>
      <div v-if="fruits.length === 0" class="card empty-card"><p>还没有时令水果，点击下方添加</p></div>
      <div class="fruit-grid">
        <div v-for="f in fruits" :key="f.id" class="card fruit-card">
          <button class="card-del" @click.stop="deleteItem('fruit', f.id, f.name)">🗑</button>
          <div class="f-tile" :style="{ background: getFruitBg(f.name) }">{{ f.emoji }}</div>
          <div class="f-name">{{ f.name }}</div>
          <div class="f-months">
            <i v-for="m in 12" :key="m" :class="{ on: m >= f.seasonFrom && m <= f.seasonTo, now: m === currentMonth }"></i>
          </div>
          <div class="f-season">{{ f.seasonFrom }} - {{ f.seasonTo }} 月当季</div>
          <div class="f-sweet">甜度 <i v-for="s in 5" :key="s" :class="{ on: s <= f.sweetness }"></i></div>
          <div class="f-price">{{ f.price }}</div>
          <div class="f-tip">{{ f.tip }}</div>
        </div>
        <div class="card fruit-add" @click="openFruitForm()"><span>＋ 添加水果</span></div>
      </div>
      </template>
    </section>

    <!-- 菜谱详情弹窗 -->
    <el-dialog v-model="showRecipeDetail" width="760px" class="warm-dialog recipe-detail-dialog">
      <template #header>
        <div class="rv-head">
          <div><div class="rv-title">{{ detailRecipe.name }}</div><div class="rv-sub">家的味道，照着做就不会翻车</div></div>
        </div>
      </template>
      <div class="rv-body">
        <div class="rv-left">
          <div class="rv-cover" :style="{ background: getRecipeBg(detailRecipe.difficulty) }">{{ getRecipeEmoji(detailRecipe) }}</div>
          <div class="rv-tags">
            <span class="rv-tag" :class="detailRecipe.difficulty">{{ diffLabel[detailRecipe.difficulty] }}</span>
            <span class="rv-tag">⏱ {{ detailRecipe.cookingTime }}分钟</span>
            <span class="rv-tag">👥 {{ detailRecipe.servings }}人份</span>
          </div>
          <div class="rv-desc">{{ detailRecipe.description }}</div>
        </div>
        <div class="rv-right">
          <div class="vs-title">🥘 用料<span class="vs-count">{{ (detailRecipe.ingredients || []).length }}种</span></div>
          <div v-for="ing in (detailRecipe.ingredients || [])" :key="ing.name" class="ing-row">
            <span>{{ ing.name }}</span>
            <span class="ing-amt">{{ ing.amount }}</span>
          </div>
          <div class="vs-title mt">👩‍🍳 做法<span class="vs-count">{{ (detailRecipe.steps || []).length }}步</span></div>
          <div v-for="(step, i) in (detailRecipe.steps || [])" :key="i" class="step-item">
            <div class="step-badge">{{ i + 1 }}</div>
            <div class="step-text">{{ typeof step === 'string' ? step : step.text }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="showRecipeDetail = false">关闭</button>
        <button class="btn-confirm" @click="openRecipeForm(detailRecipe)">✏️ 编辑</button>
      </template>
    </el-dialog>

    <!-- 通用表单弹窗 -->
    <el-dialog v-model="showForm" :title="formTitle" width="520px" class="warm-dialog">
      <el-form :model="formData" label-width="90px" class="warm-form">
        <template v-if="formType === 'recipe'">
          <el-form-item label="菜谱名称"><el-input v-model="formData.name" placeholder="如：番茄炒蛋" /></el-form-item>
          <el-form-item label="难度">
            <el-select v-model="formData.difficulty" style="width:100%">
              <el-option label="🥬 简单" value="easy" /><el-option label="🍲 中等" value="medium" /><el-option label="🔥 困难" value="hard" />
            </el-select>
          </el-form-item>
          <el-form-item label="简介"><el-input v-model="formData.description" type="textarea" :rows="2" /></el-form-item>
          <el-row :gutter="12">
            <el-col :span="12"><el-form-item label="时长(分)"><el-input-number v-model="formData.cookingTime" :min="1" style="width:100%" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="人份"><el-input-number v-model="formData.servings" :min="1" style="width:100%" /></el-form-item></el-col>
          </el-row>
          <el-form-item label="材料">
            <div v-for="(ing, i) in formData.ingredients" :key="i" style="display:flex;gap:8px;margin-bottom:6px;">
              <el-input v-model="ing.name" placeholder="材料名" style="flex:1" />
              <el-input v-model="ing.amount" placeholder="用量" style="flex:1" />
              <el-button text type="danger" @click="formData.ingredients.splice(i, 1)">删</el-button>
            </div>
            <el-button text type="primary" @click="formData.ingredients.push({ name: '', amount: '' })">+ 添加材料</el-button>
          </el-form-item>
          <el-form-item label="步骤">
            <div v-for="(step, i) in formData.steps" :key="i" style="display:flex;gap:8px;margin-bottom:6px;">
              <span style="line-height:32px;color:var(--text-secondary);font-weight:700;">{{ i + 1 }}</span>
              <el-input v-model="formData.steps[i]" type="textarea" :rows="1" style="flex:1" />
              <el-button text type="danger" @click="formData.steps.splice(i, 1)">删</el-button>
            </div>
            <el-button text type="primary" @click="formData.steps.push('')">+ 添加步骤</el-button>
          </el-form-item>
        </template>
        <template v-if="formType === 'drink'">
          <el-form-item label="饮品名称"><el-input v-model="formData.name" placeholder="如：鲜奶茶" /></el-form-item>
          <el-form-item label="品牌"><el-input v-model="formData.brand" placeholder="如：喜茶、自制" /></el-form-item>
          <el-row :gutter="12">
            <el-col :span="12"><el-form-item label="糖度"><el-input v-model="formData.sugar" placeholder="如：少糖" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="冰量"><el-input v-model="formData.ice" placeholder="如：去冰" /></el-form-item></el-col>
          </el-row>
          <el-form-item label="备注"><el-input v-model="formData.note" type="textarea" :rows="2" placeholder="口味心得..." /></el-form-item>
        </template>
        <template v-if="formType === 'shop'">
          <el-form-item label="店名"><el-input v-model="formData.name" placeholder="如：山丘面包屋" /></el-form-item>
          <el-form-item label="分类"><el-input v-model="formData.category" placeholder="如：烘焙、咖啡" /></el-form-item>
          <el-form-item label="地址"><el-input v-model="formData.address" placeholder="如：西湖区文三路" /></el-form-item>
          <el-form-item label="评分"><el-rate v-model="formData.rating" /></el-form-item>
        </template>
        <template v-if="formType === 'place'">
          <el-form-item label="景点名称"><el-input v-model="formData.name" placeholder="如：西湖苏堤" /></el-form-item>
          <el-form-item label="推荐理由"><el-input v-model="formData.description" type="textarea" :rows="2" /></el-form-item>
          <el-form-item label="适合季节">
            <el-select v-model="formData.season" style="width:100%">
              <el-option label="🌸 春" value="spring" /><el-option label="🍃 夏" value="summer" />
              <el-option label="🍁 秋" value="autumn" /><el-option label="❄️ 冬" value="winter" />
              <el-option label="🌈 全年" value="all" />
            </el-select>
          </el-form-item>
          <el-row :gutter="12">
            <el-col :span="12"><el-form-item label="距离"><el-input v-model="formData.distance" placeholder="如：80km" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="游玩时长"><el-input v-model="formData.duration" placeholder="如：1天" /></el-form-item></el-col>
          </el-row>
          <el-form-item label="费用"><el-input v-model="formData.fee" placeholder="如：免门票、¥80" /></el-form-item>
          <el-form-item label="标签"><el-input v-model="formData.tagsStr" placeholder="用逗号分隔，如：亲子,免门票" /></el-form-item>
        </template>
        <template v-if="formType === 'fruit'">
          <el-row :gutter="12">
            <el-col :span="8"><el-form-item label="水果名称"><el-input v-model="formData.name" placeholder="如：葡萄" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="图标"><el-input v-model="formData.emoji" placeholder="🍇" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="甜度"><el-input-number v-model="formData.sweetness" :min="1" :max="5" style="width:100%" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="12">
            <el-col :span="12"><el-form-item label="当季开始月"><el-input-number v-model="formData.seasonFrom" :min="1" :max="12" style="width:100%" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="当季结束月"><el-input-number v-model="formData.seasonTo" :min="1" :max="12" style="width:100%" /></el-form-item></el-col>
          </el-row>
          <el-form-item label="参考价格"><el-input v-model="formData.price" placeholder="如：¥12 / 斤" /></el-form-item>
          <el-form-item label="挑选技巧"><el-input v-model="formData.tip" type="textarea" :rows="2" /></el-form-item>
        </template>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showForm = false">取消</button>
          <button class="btn-confirm" @click="handleSave" :disabled="saving">{{ saving ? '保存中...' : (editingId ? '更新' : '保存') }}</button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFamilyGuard } from "@/composables/useFamilyGuard"
import { ref, reactive, computed, onMounted } from 'vue'
import { recipeApi, drinkApi, funShopApi, funPlaceApi, funFruitApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { ElMessage, ElMessageBox } from 'element-plus'

const authStore = useAuthStore()
const activeTab = ref('eat')
const familyId = computed(() => authStore.currentFamily?.id)
const currentMonth = new Date().getMonth() + 1
const saving = ref(false)
const recipeLoading = ref(false)
const drinkLoading = ref(false)
const shopLoading = ref(false)
const placeLoading = ref(false)
const fruitLoading = ref(false)
const loadErrors = reactive({ recipe: false, drink: false, shop: false, place: false, fruit: false })

const tabs = [
  { key: 'eat', icon: '🍳', label: '家常菜谱' },
  { key: 'drink', icon: '🧋', label: '奶茶收藏' },
  { key: 'shop', icon: '📍', label: '打卡小店' },
  { key: 'play', icon: '🏞', label: '出游景点' },
  { key: 'fruit', icon: '🍑', label: '时令水果' }
]

// ===== 菜谱 =====
const recipes = ref([])
const recipeTotal = ref(0)
const recipeFilter = ref('all')
const diffOptions = [
  { value: 'all', label: '全部' },
  { value: 'easy', label: '🥬 简单' },
  { value: 'medium', label: '🍲 中等' },
  { value: 'hard', label: '🔥 困难' }
]
const diffLabel = { easy: '简单', medium: '中等', hard: '困难' }
const recipeBgs = { easy: 'linear-gradient(135deg,#E4E6D3,#C4CBA8)', medium: 'linear-gradient(135deg,#F3E3C2,#E5C68E)', hard: 'linear-gradient(135deg,#EBD2D2,#D5A8A8)' }
const recipeEmojis = { easy: '🥗', medium: '🍲', hard: '🔥' }
function getRecipeBg(diff) { return recipeBgs[diff] || recipeBgs.medium }
function getRecipeEmoji(r) { if (r.name?.includes('蛋')) return '🍅'; if (r.name?.includes('肉')) return '🍖'; if (r.name?.includes('鱼')) return '🐟'; if (r.name?.includes('汤')) return '🌽'; if (r.name?.includes('饭')) return '🍚'; return recipeEmojis[r.difficulty] || '🍳' }
const showRecipeDetail = ref(false)
const detailRecipe = ref({})

async function loadRecipes() {
  recipeLoading.value = true
  loadErrors.recipe = false
  try {
    const params = { familyId: familyId.value, pageSize: 50 }
    if (recipeFilter.value !== 'all') params.difficulty = recipeFilter.value
    const res = await recipeApi.getList(params)
    recipes.value = res.data.list
    recipeTotal.value = res.data.total
  } catch (e) {
    loadErrors.recipe = true
    console.error(e)
  } finally {
    recipeLoading.value = false
  }
}

function viewRecipe(r) { detailRecipe.value = r; showRecipeDetail.value = true }

async function shuffleRecipe() {
  try {
    const res = await recipeApi.random({ familyId: familyId.value, count: 1 })
    if (res.data?.length) ElMessage.success(`🎲 就吃「${res.data[0].name}」吧！`)
    else ElMessage.info('还没有菜谱，先记一道菜吧')
  } catch { ElMessage.info('还没有菜谱，先记一道菜吧') }
}

// ===== 奶茶 =====
const drinks = ref([])
async function loadDrinks() {
  drinkLoading.value = true
  loadErrors.drink = false
  try {
    const res = await drinkApi.getList({ familyId: familyId.value })
    drinks.value = res.data.list
  } catch (e) {
    loadErrors.drink = true
    console.error(e)
  } finally {
    drinkLoading.value = false
  }
}
async function toggleDrinkFav(d) { const res = await drinkApi.toggleFav(d.id); d.isFav = res.data.isFav; d.likes = res.data.likes }
const drinkBgs = ['rgba(232,179,106,.2)', 'rgba(217,154,154,.2)', 'rgba(169,139,176,.2)', 'rgba(159,184,201,.2)', 'rgba(168,176,138,.2)']
const drinkEmojis = ['🧋', '🍓', '🍇', '🥥', '🍋', '🍑']
function getDrinkBg(brand) { const i = (brand || '').length % drinkBgs.length; return drinkBgs[i] }
function getDrinkEmoji(brand) { const i = (brand || '').length % drinkEmojis.length; return drinkEmojis[i] }

// ===== 小店 =====
const shops = ref([])
const checkedCount = computed(() => shops.value.filter(s => s.checkedIn).length)
async function loadShops() {
  shopLoading.value = true
  loadErrors.shop = false
  try {
    const res = await funShopApi.getList({ familyId: familyId.value })
    shops.value = res.data.list
  } catch (e) {
    loadErrors.shop = true
    console.error(e)
  } finally {
    shopLoading.value = false
  }
}
async function toggleShopCheck(s) { const res = await funShopApi.toggleCheck(s.id); s.checkedIn = res.data.checkedIn; s.checkedAt = res.data.checkedAt }
const shopBgs = { '烘焙': 'rgba(232,179,106,.2)', '糖水': 'rgba(217,154,154,.2)', '咖啡': 'rgba(168,176,138,.2)', '火锅': 'rgba(200,159,133,.2)', '日料': 'rgba(159,184,201,.2)' }
const shopEmojis = { '烘焙': '🥐', '糖水': '🍧', '咖啡': '☕', '火锅': '🍲', '日料': '🏮', '奶茶': '🧋' }
function getShopBg(cat) { return shopBgs[cat] || 'rgba(200,159,133,.15)' }
function getShopEmoji(cat) { return shopEmojis[cat] || '🏪' }

// ===== 景点 =====
const places = ref([])
const seasonFilter = ref('all')
const seasonOptions = [
  { value: 'all', label: '全部' },
  { value: 'spring', label: '🌸 春' },
  { value: 'summer', label: '🍃 夏' },
  { value: 'autumn', label: '🍁 秋' },
  { value: 'winter', label: '❄️ 冬' }
]
const seasonLabel = { spring: '🌸 春', summer: '🍃 夏', autumn: '🍁 秋', winter: '❄️ 冬', all: '🌈 全年' }
const placeBgs = { spring: 'linear-gradient(135deg,#F6DFC8,#EFC9A8)', summer: 'linear-gradient(135deg,#DFE3E6,#B9C6CE)', autumn: 'linear-gradient(135deg,#E4E6D3,#C4CBA8)', winter: 'linear-gradient(135deg,#EBD2D2,#D5A8A8)', all: 'linear-gradient(135deg,#F3E3C2,#E5C68E)' }
const placeEmojis = { spring: '🌸', summer: '🎋', autumn: '🍁', winter: '🏰', all: '🏞' }
function getPlaceBg(s) { return placeBgs[s] || placeBgs.all }
function getPlaceEmoji(s) { return placeEmojis[s] || '🏞' }
async function loadPlaces() {
  placeLoading.value = true
  loadErrors.place = false
  try {
    const params = { familyId: familyId.value }
    if (seasonFilter.value !== 'all') params.season = seasonFilter.value
    const res = await funPlaceApi.getList(params)
    places.value = res.data.list
  } catch (e) {
    loadErrors.place = true
    console.error(e)
  } finally {
    placeLoading.value = false
  }
}
async function togglePlaceWish(p) { const res = await funPlaceApi.toggleWish(p.id); p.isWish = res.data.isWish }

// ===== 水果 =====
const fruits = ref([])
async function loadFruits() {
  fruitLoading.value = true
  loadErrors.fruit = false
  try {
    const res = await funFruitApi.getList({ familyId: familyId.value })
    fruits.value = res.data.list
  } catch (e) {
    loadErrors.fruit = true
    console.error(e)
  } finally {
    fruitLoading.value = false
  }
}
const fruitBgs = ['rgba(217,154,154,.2)', 'rgba(169,139,176,.2)', 'rgba(200,159,133,.2)', 'rgba(232,179,106,.2)', 'rgba(168,176,138,.2)', 'rgba(159,184,201,.2)']
function getFruitBg(name) { const i = (name || '').length % fruitBgs.length; return fruitBgs[i] }

// ===== 表单 =====
const showForm = ref(false)
const formType = ref('')
const formTitle = ref('')
const editingId = ref(null)
const formData = reactive({})

function resetForm() {
  Object.keys(formData).forEach(k => delete formData[k])
  editingId.value = null
}

function openRecipeForm(r) {
  resetForm(); formType.value = 'recipe'; showRecipeDetail.value = false
  if (r?.id) {
    editingId.value = r.id; formTitle.value = '✏️ 编辑菜谱'
    Object.assign(formData, { name: r.name, description: r.description, difficulty: r.difficulty, cookingTime: r.cookingTime, servings: r.servings, ingredients: (r.ingredients || []).map(i => ({ ...i })), steps: (r.steps || []).map(s => typeof s === 'string' ? s : s.text) })
  } else {
    formTitle.value = '🍳 记一道菜'
    Object.assign(formData, { name: '', description: '', difficulty: 'medium', cookingTime: 15, servings: 2, ingredients: [{ name: '', amount: '' }], steps: [''] })
  }
  showForm.value = true
}

function openDrinkForm() { resetForm(); formType.value = 'drink'; formTitle.value = '🧋 收藏一杯新的'; Object.assign(formData, { name: '', brand: '', sugar: '', ice: '', note: '' }); showForm.value = true }
function openShopForm() { resetForm(); formType.value = 'shop'; formTitle.value = '📍 添加小店'; Object.assign(formData, { name: '', category: '', address: '', rating: 5 }); showForm.value = true }
function openPlaceForm() { resetForm(); formType.value = 'place'; formTitle.value = '🏞 添加景点'; Object.assign(formData, { name: '', description: '', season: 'all', distance: '', duration: '', fee: '', tagsStr: '' }); showForm.value = true }
function openFruitForm() { resetForm(); formType.value = 'fruit'; formTitle.value = '🍑 添加水果'; Object.assign(formData, { name: '', emoji: '🍎', sweetness: 3, seasonFrom: 1, seasonTo: 12, price: '', tip: '' }); showForm.value = true }

async function handleSave() {
  // 表单验证
  if (formType.value === 'recipe' && !formData.name?.trim()) {
    ElMessage.warning('请输入菜谱名称')
    return
  }
  if (formType.value === 'drink' && !formData.name?.trim()) {
    ElMessage.warning('请输入饮品名称')
    return
  }
  if (formType.value === 'shop' && !formData.name?.trim()) {
    ElMessage.warning('请输入店名')
    return
  }
  if (formType.value === 'place' && !formData.name?.trim()) {
    ElMessage.warning('请输入景点名称')
    return
  }
  if (formType.value === 'fruit' && !formData.name?.trim()) {
    ElMessage.warning('请输入水果名称')
    return
  }

  const fid = familyId.value
  saving.value = true
  try {
    if (formType.value === 'recipe') {
      const payload = { ...formData, familyId: fid, ingredients: formData.ingredients?.filter(i => i.name), steps: formData.steps?.filter(s => s) }
      if (editingId.value) await recipeApi.update(editingId.value, payload)
      else await recipeApi.create(payload)
      loadRecipes()
    } else if (formType.value === 'drink') {
      if (editingId.value) await drinkApi.update(editingId.value, formData)
      else await drinkApi.create({ ...formData, familyId: fid })
      loadDrinks()
    } else if (formType.value === 'shop') {
      if (editingId.value) await funShopApi.update(editingId.value, formData)
      else await funShopApi.create({ ...formData, familyId: fid })
      loadShops()
    } else if (formType.value === 'place') {
      const payload = { ...formData, familyId: fid, tags: formData.tagsStr ? formData.tagsStr.split(/[,，]/).map(s => s.trim()).filter(Boolean) : [] }
      if (editingId.value) await funPlaceApi.update(editingId.value, payload)
      else await funPlaceApi.create(payload)
      loadPlaces()
    } else if (formType.value === 'fruit') {
      if (editingId.value) await funFruitApi.update(editingId.value, formData)
      else await funFruitApi.create({ ...formData, familyId: fid })
      loadFruits()
    }
    ElMessage.success(editingId.value ? '更新成功' : '保存成功')
    showForm.value = false
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

const deleteApiMap = {
  recipe: { remove: recipeApi.remove, load: loadRecipes },
  drink: { remove: drinkApi.remove, load: loadDrinks },
  shop: { remove: funShopApi.remove, load: loadShops },
  place: { remove: funPlaceApi.remove, load: loadPlaces },
  fruit: { remove: funFruitApi.remove, load: loadFruits }
}
async function deleteItem(type, id, name) {
  try {
    await ElMessageBox.confirm(`确定删除「${name}」？`, '确认删除', { type: 'warning' })
    await deleteApiMap[type].remove(id)
    ElMessage.success('已删除')
    deleteApiMap[type].load()
  } catch (e) { if (e !== 'cancel') console.error(e) }
}

onMounted(async () => {
  if (!await useFamilyGuard()) return
  loadRecipes(); loadDrinks(); loadShops(); loadPlaces(); loadFruits()
})
</script>

<style scoped>
/* ===== 页面头部 ===== */
.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.page-sub { margin-top: 6px; font-size: 13.5px; color: var(--text-secondary); }
.head-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 11px 18px; border-radius: 13px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; background: linear-gradient(135deg, var(--terracotta), #D3A98B); color: #FFF9F2; box-shadow: 0 8px 20px rgba(200,159,133,.4); transition: transform .3s, box-shadow .3s; }
.btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(200,159,133,.3); }
.btn-ghost { display: inline-flex; align-items: center; gap: 7px; padding: 11px 18px; border-radius: 13px; border: 1.5px solid var(--border); cursor: pointer; font-size: 14px; font-weight: 600; background: rgba(255,253,250,.85); color: var(--terra-deep); transition: transform .3s, box-shadow .3s; }
.btn-ghost:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(200,159,133,.15); }

/* ===== 子标签页 ===== */
.subtabs { display: flex; gap: 6px; background: rgba(243,234,221,.6); border: 1px solid var(--border); padding: 5px; border-radius: 16px; margin-bottom: 22px; overflow-x: auto; }
.subtab { padding: 10px 18px; border-radius: 12px; border: none; background: transparent; color: var(--text-secondary); font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all .3s; }
.subtab:hover { color: var(--terra-deep); }
.subtab.active { background: var(--bg-card); color: var(--terra-deep); box-shadow: 0 4px 14px rgba(160,120,90,.14); }

/* ===== 筛选栏 ===== */
.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; align-items: center; }
.fchip { padding: 9px 15px; border-radius: 999px; border: 1.5px solid var(--border); background: rgba(255,253,250,.8); color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .25s; }
.fchip:hover { border-color: var(--terracotta); color: var(--terra-deep); }
.fchip.active { background: var(--terracotta); border-color: var(--terracotta); color: #fff; }
.filter-count { margin-left: auto; font-size: 12.5px; color: var(--text-secondary); }
.filter-count b { color: var(--terra-deep); }

/* ===== 卡片删除按钮 ===== */
.card-del { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border-radius: 8px; border: none; background: rgba(255,253,250,.9); color: var(--terra-deep); cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(160,120,90,.15); opacity: 0; transition: all .25s; z-index: 2; }
.recipe-card:hover .card-del, .drink-card:hover .card-del, .shop-card:hover .card-del, .place-card:hover .card-del, .fruit-card:hover .card-del { opacity: 1; }
.card-del:hover { background: #B06A6A; color: #fff; }

/* ===== 空状态 ===== */


/* ===== 错误状态 ===== */

/* ===== 菜谱卡片 ===== */
.recipe-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.recipe-card { padding: 0; overflow: hidden; cursor: pointer; position: relative; transition: transform .35s, box-shadow .35s; }
.recipe-card:hover { transform: translateY(-5px); box-shadow: 0 16px 36px rgba(160,120,90,.16); }
.rcov { height: 140px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.rcov-emoji { font-size: 46px; transition: transform .6s cubic-bezier(.22,1,.36,1); }
.recipe-card:hover .rcov-emoji { transform: scale(1.25) rotate(-8deg); }
.diff-badge { position: absolute; top: 10px; right: 10px; font-size: 11px; font-weight: 700; padding: 3px 11px; border-radius: 999px; backdrop-filter: blur(6px); }
.diff-badge.easy { background: rgba(168,176,138,.28); color: #7E8862; }
.diff-badge.medium { background: rgba(232,179,106,.3); color: #C08A3E; }
.diff-badge.hard { background: rgba(217,154,154,.3); color: #B06A6A; }
.rbody { padding: 14px 16px 16px; }
.rname { font-size: 15.5px; font-weight: 700; }
.rdesc { font-size: 12.5px; color: var(--text-secondary); margin-top: 5px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.rmeta { display: flex; gap: 12px; margin-top: 11px; padding-top: 10px; border-top: 1px dashed var(--border); font-size: 12px; color: var(--text-secondary); flex-wrap: wrap; }
.rview { position: absolute; inset: 0; background: rgba(107,87,68,.42); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .3s; }
.recipe-card:hover .rview { opacity: 1; }
.rview span { background: var(--bg-card); color: var(--terra-deep); font-size: 13px; font-weight: 700; padding: 9px 18px; border-radius: 999px; box-shadow: 0 6px 18px rgba(0,0,0,.18); }

/* ===== 奶茶卡片 ===== */
.drink-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.drink-card { padding: 16px; transition: transform .35s, box-shadow .35s; }
.drink-card:hover { transform: translateY(-5px); box-shadow: 0 16px 36px rgba(160,120,90,.16); }
.dk-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
.cup { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 25px; transition: transform .4s cubic-bezier(.34,1.56,.64,1); }
.drink-card:hover .cup { transform: rotate(-8deg) scale(1.1); }
.heart { border: none; background: transparent; cursor: pointer; display: flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 700; color: var(--text-secondary); padding: 4px 6px; border-radius: 999px; transition: all .25s; }
.heart.on { color: #B06A6A; }
.dk-name { font-size: 15px; font-weight: 700; }
.dk-brand { display: inline-block; font-size: 11.5px; font-weight: 600; padding: 2px 9px; border-radius: 999px; background: var(--apricot); color: var(--terra-deep); margin-top: 6px; }
.dk-tags { display: flex; gap: 6px; margin-top: 9px; flex-wrap: wrap; }
.dk-tag { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; background: rgba(159,184,201,.18); color: #6E8CA0; }
.dk-tag.ice { background: rgba(168,176,138,.18); color: #7E8862; }
.dk-note { font-size: 12px; color: var(--text-secondary); margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border); line-height: 1.5; }
.drink-add { border: 1.5px dashed var(--wood-light); background: rgba(243,234,221,.4); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 150px; color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .3s; }
.drink-add:hover { border-color: var(--terracotta); color: var(--terra-deep); background: rgba(243,234,221,.8); transform: translateY(-4px); }
.plus-icon { width: 42px; height: 42px; border-radius: 14px; background: rgba(200,159,133,.16); display: flex; align-items: center; justify-content: center; font-size: 20px; color: var(--terra-deep); }

/* ===== 打卡小店 ===== */
.ck-summary { display: flex; align-items: center; gap: 16px; padding: 18px; margin-bottom: 18px; background: linear-gradient(120deg, rgba(232,179,106,.16), rgba(217,154,154,.14)); border: 1.5px solid rgba(232,179,106,.4); }
.ck-ico { width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, var(--amber), #C08A3E); color: #fff; font-size: 21px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ck-info { flex: 1; min-width: 0; }
.ck-text { font-size: 14px; font-weight: 600; }
.ck-text b { color: #C08A3E; }
.ck-bar { height: 8px; border-radius: 999px; background: rgba(255,253,250,.8); margin-top: 9px; overflow: hidden; }
.ck-bar i { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--amber), var(--rose)); transition: width 1s cubic-bezier(.22,1,.36,1); }
.shop-list { display: flex; flex-direction: column; gap: 14px; }
.shop-card { display: flex; align-items: center; gap: 14px; padding: 16px 18px; position: relative; overflow: hidden; transition: transform .3s, box-shadow .3s; }
.shop-card:hover { transform: translateY(-3px); box-shadow: 0 14px 32px rgba(160,120,90,.14); }
.sp-ico { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.sp-body { flex: 1; min-width: 0; }
.sp-name { font-size: 15px; font-weight: 700; }
.sp-cat { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 999px; background: var(--apricot); color: var(--terra-deep); margin-left: 8px; vertical-align: 2px; }
.sp-addr { font-size: 12px; color: var(--text-secondary); margin-top: 5px; }
.sp-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
.stars { font-size: 13px; letter-spacing: 2px; color: #C08A3E; }
.ck-btn { padding: 7px 14px; border-radius: 10px; border: 1.5px solid var(--border); background: rgba(255,253,250,.8); color: var(--terra-deep); font-size: 12px; font-weight: 700; cursor: pointer; transition: all .25s; }
.ck-btn:hover { border-color: var(--amber); background: var(--amber); color: #fff; }
.shop-card.done .ck-btn { background: rgba(168,176,138,.2); border-color: transparent; color: #7E8862; cursor: default; }
.stamp { position: absolute; right: 16px; top: 12px; transform: rotate(-14deg) scale(1.8); opacity: 0; border: 2.5px solid #B06A6A; color: #B06A6A; font-weight: 800; font-size: 13px; letter-spacing: .25em; padding: 4px 12px; border-radius: 8px; pointer-events: none; transition: all .4s cubic-bezier(.34,1.56,.64,1); }
.shop-card.done .stamp { opacity: .8; transform: rotate(-14deg) scale(1); }
.shop-add { border: 1.5px dashed var(--wood-light); background: rgba(243,234,221,.4); padding: 18px; text-align: center; color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .3s; }
.shop-add:hover { border-color: var(--terracotta); color: var(--terra-deep); }

/* ===== 出游景点 ===== */
.place-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.place-card { padding: 0; overflow: hidden; transition: transform .35s, box-shadow .35s; }
.place-card:hover { transform: translateY(-5px); box-shadow: 0 16px 36px rgba(160,120,90,.16); }
.scene { height: 120px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.scene-emoji { font-size: 42px; transition: transform .6s cubic-bezier(.22,1,.36,1); }
.place-card:hover .scene-emoji { transform: scale(1.2); }
.season-tag { position: absolute; top: 10px; left: 10px; font-size: 11px; font-weight: 700; padding: 3px 11px; border-radius: 999px; backdrop-filter: blur(6px); background: rgba(255,253,250,.75); color: var(--terra-deep); }
.wish-btn { position: absolute; top: 8px; right: 8px; border: none; background: rgba(255,253,250,.8); backdrop-filter: blur(6px); width: 32px; height: 32px; border-radius: 10px; cursor: pointer; font-size: 15px; display: flex; align-items: center; justify-content: center; transition: all .25s; }
.wish-btn:hover { transform: scale(1.12); }
.wish-btn.on { background: var(--rose); color: #fff; }
.pbody { padding: 14px 16px 16px; }
.pname { font-size: 15.5px; font-weight: 700; }
.pwhy { font-size: 12.5px; color: var(--text-secondary); margin-top: 5px; }
.pmeta { display: flex; flex-direction: column; gap: 5px; margin-top: 11px; padding-top: 10px; border-top: 1px dashed var(--border); font-size: 12px; color: var(--text-secondary); }
.ptag-row { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
.ptag { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; background: rgba(159,184,201,.18); color: #6E8CA0; }
.ptag.fee { background: rgba(168,176,138,.18); color: #7E8862; }
.place-add { border: 1.5px dashed var(--wood-light); background: rgba(243,234,221,.4); display: flex; align-items: center; justify-content: center; min-height: 280px; color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .3s; }
.place-add:hover { border-color: var(--terracotta); color: var(--terra-deep); }

/* ===== 时令水果 ===== */
.fruit-banner { display: flex; align-items: center; gap: 14px; padding: 18px; margin-bottom: 18px; background: linear-gradient(120deg, rgba(168,176,138,.16), rgba(232,179,106,.16)); border: 1.5px solid rgba(168,176,138,.4); }
.fb-ico { width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, var(--sage), #7E8862); color: #fff; font-size: 21px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.fb-text { font-size: 14px; line-height: 1.6; }
.fb-text b { color: #7E8862; }
.fruit-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.fruit-card { padding: 16px; text-align: center; transition: transform .35s, box-shadow .35s; }
.fruit-card:hover { transform: translateY(-5px); box-shadow: 0 16px 36px rgba(160,120,90,.16); }
.f-tile { width: 64px; height: 64px; margin: 0 auto; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 30px; transition: transform .4s cubic-bezier(.34,1.56,.64,1); }
.fruit-card:hover .f-tile { transform: scale(1.12) rotate(-6deg); }
.f-name { font-size: 15px; font-weight: 700; margin-top: 10px; }
.f-months { display: flex; gap: 3px; justify-content: center; margin-top: 10px; }
.f-months i { width: 8px; height: 8px; border-radius: 50%; background: var(--cream); border: 1px solid var(--border); }
.f-months i.on { background: var(--sage); border-color: var(--sage); }
.f-months i.now { box-shadow: 0 0 0 3px rgba(200,159,133,.3); background: var(--terracotta); border-color: var(--terracotta); }
.f-season { font-size: 11px; color: var(--text-secondary); margin-top: 6px; }
.f-sweet { display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 9px; font-size: 11px; color: var(--text-secondary); }
.f-sweet i { width: 7px; height: 7px; border-radius: 50%; background: var(--cream); border: 1px solid var(--border); }
.f-sweet i.on { background: var(--amber); border-color: var(--amber); }
.f-price { font-size: 13px; font-weight: 700; color: var(--terra-deep); margin-top: 8px; }
.f-tip { font-size: 11.5px; color: var(--text-secondary); margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border); line-height: 1.5; }
.fruit-add { border: 1.5px dashed var(--wood-light); background: rgba(243,234,221,.4); display: flex; align-items: center; justify-content: center; min-height: 200px; color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .3s; }
.fruit-add:hover { border-color: var(--terracotta); color: var(--terra-deep); }

/* ===== 菜谱详情弹窗 ===== */
.rv-head { padding: 0; }
.rv-title { font-size: 18px; font-weight: 800; color: var(--terra-deep); }
.rv-sub { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.rv-body { display: flex; gap: 0; max-height: 62vh; overflow: hidden; }
.rv-left { width: 250px; flex-shrink: 0; border-right: 1px dashed var(--border); display: flex; flex-direction: column; overflow-y: auto; }
.rv-cover { height: 170px; display: flex; align-items: center; justify-content: center; font-size: 56px; }
.rv-tags { display: flex; gap: 6px; flex-wrap: wrap; padding: 14px 16px 0; }
.rv-tag { font-size: 11.5px; font-weight: 700; padding: 3px 11px; border-radius: 999px; background: var(--apricot); color: var(--terra-deep); }
.rv-tag.easy { background: rgba(168,176,138,.22); color: #7E8862; }
.rv-tag.medium { background: rgba(232,179,106,.26); color: #C08A3E; }
.rv-tag.hard { background: rgba(217,154,154,.26); color: #B06A6A; }
.rv-desc { padding: 12px 16px 18px; font-size: 12.5px; color: var(--text-secondary); line-height: 1.7; }
.rv-right { flex: 1; min-width: 0; overflow-y: auto; padding: 16px 20px 22px; }
.vs-title { font-size: 15px; font-weight: 800; color: var(--terra-deep); display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.vs-count { font-size: 11px; font-weight: 600; color: var(--text-secondary); background: var(--cream); padding: 2px 9px; border-radius: 999px; }
.vs-title.mt { margin-top: 20px; }
.ing-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 2px; border-bottom: 1px dashed var(--border); font-size: 13px; }
.ing-amt { font-weight: 700; color: var(--terra-deep); }
.step-item { display: flex; gap: 10px; margin-bottom: 12px; }
.step-badge { width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, var(--terracotta), var(--terra-deep)); color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
.step-text { flex: 1; font-size: 13px; line-height: 1.65; }

/* ===== 弹窗按钮 ===== */
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
.btn-cancel { padding: 10px 20px; border-radius: 12px; border: 1.5px solid var(--border); background: rgba(255,253,250,.85); color: var(--text-secondary); font-size: 14px; font-weight: 600; cursor: pointer; transition: all .25s; font-family: inherit; }
.btn-cancel:hover { border-color: var(--terracotta); color: var(--terra-deep); }
.btn-confirm { padding: 10px 24px; border-radius: 12px; border: none; background: linear-gradient(135deg, var(--terracotta), #D3A98B); color: #FFF9F2; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 6px 18px rgba(200,159,133,.35); transition: all .25s; font-family: inherit; }
.btn-confirm:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(200,159,133,.4); }
.btn-confirm:disabled { opacity: .6; cursor: not-allowed; transform: none; box-shadow: none; }
.btn-confirm:disabled:hover { transform: none; box-shadow: none; }

/* ===== 响应式 ===== */
@media (max-width: 960px) {
  .recipe-grid, .drink-grid, .place-grid { grid-template-columns: repeat(2, 1fr); }
  .fruit-grid { grid-template-columns: repeat(2, 1fr); }
  .rv-body { flex-direction: column; overflow-y: auto; max-height: 66vh; }
  .rv-left { width: 100%; border-right: none; border-bottom: 1px dashed var(--border); }
}
@media (max-width: 600px) {
  .recipe-grid, .drink-grid, .place-grid, .fruit-grid { grid-template-columns: 1fr; }
  .shop-card { flex-direction: column; align-items: flex-start; }
  .sp-right { flex-direction: row; width: 100%; justify-content: space-between; align-items: center; }
  .page-title { font-size: 22px; }
  .subtab { padding: 8px 12px; font-size: 13px; }
}
</style>

<!-- 全局弹窗样式 -->
<style>
.warm-dialog.el-dialog { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; box-shadow: 0 20px 60px rgba(160,120,90,.18); overflow: visible; }
.warm-dialog.el-dialog .el-dialog__header { padding: 20px 24px 0; margin: 0; }
.warm-dialog.el-dialog .el-dialog__title { font-size: 18px; font-weight: 700; color: var(--terra-deep); }
.warm-dialog.el-dialog .el-dialog__body { padding: 16px 24px 8px; overflow: visible; }
.warm-dialog.el-dialog .el-dialog__footer { padding: 8px 24px 20px; }
.warm-form .el-form-item__label { color: var(--text-primary); font-weight: 600; font-size: 13px; }
.warm-form .el-input__wrapper, .warm-form .el-textarea__inner { background: #FFFDF9; border: 1.5px solid #E2CDB2; border-radius: 12px; box-shadow: none; }
.warm-form .el-input__wrapper:hover, .warm-form .el-textarea__inner:hover { border-color: #C89F85; }
.warm-form .el-input__wrapper.is-focus, .warm-form .el-textarea__inner:focus { border-color: #C89F85; box-shadow: 0 0 0 3px rgba(200,159,133,.12); }
.warm-form .el-select .el-input__wrapper { background: #FFFDF9; }
.recipe-detail-dialog.el-dialog { max-width: 760px; }
</style>
