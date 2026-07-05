import dayjs from 'dayjs'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

/**
 * 格式化金额
 * @param {number|string} v - 金额值
 * @returns {string} 格式化后的金额字符串，如 "123.45"
 */
export function formatMoney(v) {
  return parseFloat(v || 0).toFixed(2)
}

/**
 * 格式化日期
 * @param {string|Date} d - 日期值
 * @param {string} fmt - 格式，默认 'YYYY-MM-DD'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(d, fmt = 'YYYY-MM-DD') {
  return d ? dayjs(d).format(fmt) : '-'
}

/**
 * 安全渲染 Markdown（带 XSS 消毒）
 * @param {string} text - Markdown 文本
 * @returns {string} 消毒后的 HTML
 */
export function renderMarkdownSafe(text) {
  if (!text) return ''
  const html = marked(text)
  return DOMPurify.sanitize(html)
}
