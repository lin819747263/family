<template>
  <div class="chat-panel" :class="{ open: visible }">
    <!-- 遮罩 -->
    <div v-if="visible" class="chat-overlay" @click="close"></div>

    <!-- 聊天窗口 -->
    <div v-show="visible" class="chat-window">
      <!-- 头部 -->
      <div class="chat-header">
        <div class="chat-header-left">
          <div class="chat-avatar">🤖</div>
          <div>
            <div class="chat-title">AI 小助手</div>
            <div class="chat-subtitle">AI 驱动 · 支持智能记账</div>
          </div>
        </div>
        <div class="chat-header-right">
          <button class="chat-clear" @click="clearHistory" title="清空对话"><el-icon><Delete /></el-icon></button>
          <button class="chat-close" @click="close"><el-icon><Close /></el-icon></button>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="chat-messages" ref="messagesRef">
        <div v-if="messages.length === 0" class="chat-empty">
          <div class="chat-empty-icon">💬</div>
          <p>你好！我是家庭管家 AI 助手</p>
          <p class="chat-empty-hint">可以说一句话快速记账，也可以问我任何问题</p>
          <div class="chat-suggestions">
            <button v-for="s in suggestions" :key="s" class="suggestion-btn" @click="sendMessage(s)">{{ s }}</button>
          </div>
        </div>

        <div v-for="(msg, i) in messages" :key="i" class="chat-msg" :class="msg.role">
          <div class="msg-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
          <div class="msg-bubble">
            <!-- 记账卡片 -->
            <div v-if="msg.type === 'transaction' && msg.transaction" class="txn-card">
              <div class="txn-card-header">
                <span class="txn-card-icon">{{ msg.transaction.type === 'expense' ? '📉' : '📈' }}</span>
                <span class="txn-card-label">{{ msg.transaction.type === 'expense' ? '支出' : '收入' }}</span>
              </div>
              <div class="txn-card-amount" :class="msg.transaction.type">
                {{ msg.transaction.type === 'expense' ? '-' : '+' }}¥{{ parseFloat(msg.transaction.amount).toFixed(2) }}
              </div>
              <div class="txn-card-detail">
                <span class="txn-card-cat">{{ msg.transaction.categoryName }}</span>
                <span class="txn-card-note" v-if="msg.transaction.note">{{ msg.transaction.note }}</span>
              </div>
              <div class="txn-card-date">{{ msg.transaction.date }}</div>
              <div class="txn-card-status success">
                <el-icon><Check /></el-icon> 已记账
              </div>
            </div>
            <!-- 待办卡片 -->
            <div v-else-if="msg.type === 'todo' && msg.todo" class="todo-card">
              <div class="todo-card-header">
                <span class="todo-card-icon">📋</span>
                <span class="todo-card-label">待办事项</span>
              </div>
              <div class="todo-card-title">{{ msg.todo.title }}</div>
              <div class="todo-card-detail">
                <span v-if="msg.todo.dueDate" class="todo-card-date">
                  <el-icon><Calendar /></el-icon> {{ msg.todo.dueDate }}{{ msg.todo.dueTime ? ' ' + msg.todo.dueTime : '' }}
                </span>
                <span class="todo-card-priority" :class="msg.todo.priority">{{ priorityLabel(msg.todo.priority) }}</span>
              </div>
              <div class="todo-card-status success">
                <el-icon><Check /></el-icon> 已添加
              </div>
            </div>
            <!-- 普通文本 -->
            <div v-else class="msg-content markdown-body" v-html="renderMarkdown(msg.content)"></div>
          </div>
        </div>

        <!-- 加载中 -->
        <div v-if="loading" class="chat-msg assistant">
          <div class="msg-avatar">🤖</div>
          <div class="msg-bubble">
            <div class="msg-loading">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入框 -->
      <div class="chat-input-area">
        <textarea
          ref="inputRef"
          v-model="inputText"
          class="chat-input"
          placeholder="输入问题或一句话记账..."
          rows="1"
          @keydown.enter.exact.prevent="handleSend"
          @input="autoResize"
        ></textarea>
        <button class="chat-send" :disabled="!inputText.trim() || loading" @click="handleSend">
          <el-icon><Promotion /></el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch } from 'vue'
import { aiApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { renderMarkdownSafe } from '@/utils/format'
import { ElMessage } from 'element-plus'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close'])

const authStore = useAuthStore()
const messages = ref([])
const inputText = ref('')
const loading = ref(false)
const messagesRef = ref(null)
const inputRef = ref(null)

const suggestions = [
  '午饭花了35块',
  '买菜花了58元',
  '收到工资8000元',
  '推荐一道简单的家常菜',
  '如何制定家庭月度预算？'
]

// 从 localStorage 加载历史
onMounted(() => {
  try {
    const saved = localStorage.getItem('ai_chat_history')
    if (saved) messages.value = JSON.parse(saved)
  } catch { /* ignore */ }
})

// 保存历史到 localStorage
watch(messages, (val) => {
  try {
    const toSave = val.slice(-50)
    localStorage.setItem('ai_chat_history', JSON.stringify(toSave))
  } catch { /* ignore */ }
}, { deep: true })

function close() {
  emit('close')
}

function clearHistory() {
  messages.value = []
  localStorage.removeItem('ai_chat_history')
}

function priorityLabel(p) {
  return { low: '低优先级', medium: '中优先级', high: '高优先级' }[p] || '中优先级'
}

function renderMarkdown(text) {
  return renderMarkdownSafe(text)
}

function autoResize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

function handleSend() {
  const text = inputText.value.trim()
  if (!text || loading.value) return
  sendMessage(text)
  inputText.value = ''
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.style.height = 'auto'
    }
  })
}

async function sendMessage(text) {
  // 添加用户消息
  messages.value.push({ role: 'user', content: text })
  scrollToBottom()

  loading.value = true
  try {
    // 构建消息历史（最近 10 条）
    const recentMessages = messages.value.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }))

    const familyId = authStore.currentFamily?.id
    const res = await aiApi.chat({ messages: recentMessages, familyId })
    const data = res.data

    // 检查是否有工具调用结果
    if (data?.toolCall?.name === 'create_transaction' && data.toolCall.result?.success) {
      messages.value.push({
        role: 'assistant',
        type: 'transaction',
        transaction: data.toolCall.result.transaction,
        content: data.reply || '记账成功！'
      })
    } else if (data?.toolCall?.name === 'create_todo' && data.toolCall.result?.success) {
      messages.value.push({
        role: 'assistant',
        type: 'todo',
        todo: data.toolCall.result.todo,
        content: data.reply || '待办已添加！'
      })
    } else {
      const reply = data?.reply || '抱歉，我暂时无法回答。'
      messages.value.push({ role: 'assistant', content: reply })
    }
  } catch (e) {
    console.error(e)
    messages.value.push({ role: 'assistant', content: '⚠️ 请求失败，请稍后重试。' })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

// 打开时聚焦输入框
watch(() => props.visible, (val) => {
  if (val) nextTick(() => inputRef.value?.focus())
})
</script>

<style scoped>
.chat-overlay {
  position: fixed;
  inset: 0;
  z-index: 998;
  background: rgba(0,0,0,0.2);
}

.chat-window {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  max-height: 100vh;
  background: #fff;
  z-index: 999;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0,0,0,0.1);
  animation: slideIn 0.25s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* 头部 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  flex-shrink: 0;
}
.chat-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.chat-avatar {
  font-size: 28px;
}
.chat-title {
  font-size: 16px;
  font-weight: 600;
}
.chat-subtitle {
  font-size: 11px;
  opacity: 0.8;
}
.chat-header-right {
  display: flex;
  gap: 4px;
}
.chat-clear, .chat-close {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255,255,255,0.15);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.chat-clear:hover, .chat-close:hover {
  background: rgba(255,255,255,0.25);
}

/* 消息列表 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-empty {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}
.chat-empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.chat-empty p {
  margin: 4px 0;
  font-size: 14px;
}
.chat-empty-hint {
  font-size: 12px !important;
  color: #cbd5e1;
}
.chat-suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
}
.suggestion-btn {
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}
.suggestion-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: rgba(102,126,234,0.04);
}

/* 消息 */
.chat-msg {
  display: flex;
  gap: 10px;
  max-width: 100%;
}
.chat-msg.user {
  flex-direction: row-reverse;
}
.msg-avatar {
  font-size: 20px;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.msg-bubble {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.6;
}
.chat-msg.user .msg-bubble {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.chat-msg.assistant .msg-bubble {
  background: #f1f5f9;
  color: #334155;
  border-bottom-left-radius: 4px;
}

/* 记账卡片 */
.txn-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  min-width: 200px;
}
.txn-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.txn-card-icon {
  font-size: 18px;
}
.txn-card-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}
.txn-card-amount {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 8px;
}
.txn-card-amount.expense {
  color: #ef4444;
}
.txn-card-amount.income {
  color: #10b981;
}
.txn-card-detail {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}
.txn-card-cat {
  font-size: 13px;
  color: #667eea;
  background: rgba(102,126,234,0.08);
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 500;
}
.txn-card-note {
  font-size: 12px;
  color: #94a3b8;
}
.txn-card-date {
  font-size: 12px;
  color: #cbd5e1;
  margin-bottom: 8px;
}
.txn-card-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}
.txn-card-status.success {
  color: #10b981;
}

/* 待办卡片 */
.todo-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  min-width: 200px;
}
.todo-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}
.todo-card-icon {
  font-size: 18px;
}
.todo-card-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}
.todo-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 10px;
  line-height: 1.4;
}
.todo-card-detail {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.todo-card-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 6px;
}
.todo-card-priority {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 500;
}
.todo-card-priority.high {
  background: #fef2f2;
  color: #ef4444;
}
.todo-card-priority.medium {
  background: #eff6ff;
  color: #3b82f6;
}
.todo-card-priority.low {
  background: #f1f5f9;
  color: #94a3b8;
}
.todo-card-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}
.todo-card-status.success {
  color: #10b981;
}

/* Markdown 样式 */
.msg-content :deep(p) {
  margin: 6px 0;
}
.msg-content :deep(ul), .msg-content :deep(ol) {
  padding-left: 20px;
  margin: 6px 0;
}
.msg-content :deep(code) {
  background: rgba(0,0,0,0.06);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 13px;
}
.chat-msg.user .msg-content :deep(code) {
  background: rgba(255,255,255,0.2);
}
.msg-content :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
}
.msg-content :deep(pre code) {
  background: none;
  color: inherit;
  padding: 0;
}
.msg-content :deep(strong) {
  font-weight: 700;
}
.msg-content :deep(blockquote) {
  border-left: 3px solid #667eea;
  padding-left: 12px;
  margin: 8px 0;
  color: #64748b;
}

/* 加载动画 */
.msg-loading {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}
.msg-loading span {
  width: 6px;
  height: 6px;
  background: #94a3b8;
  border-radius: 50%;
  animation: bounce 1.2s infinite;
}
.msg-loading span:nth-child(2) { animation-delay: 0.2s; }
.msg-loading span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

/* 输入框 */
.chat-input-area {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
  background: #fff;
  flex-shrink: 0;
}
.chat-input {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.5;
  color: #334155;
  resize: none;
  outline: none;
  max-height: 120px;
  font-family: inherit;
  transition: border-color 0.2s;
}
.chat-input:focus {
  border-color: #667eea;
}
.chat-input::placeholder {
  color: #94a3b8;
}
.chat-send {
  width: 40px;
  height: 40px;
  border: none;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.chat-send:hover:not(:disabled) {
  transform: scale(1.05);
}
.chat-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 768px) {
  .chat-window {
    width: 100vw;
  }
  .chat-overlay {
    display: none;
  }
}
</style>
