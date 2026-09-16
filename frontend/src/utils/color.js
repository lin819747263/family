/**
 * CSS 变量颜色解析工具
 * ECharts 渲染到 Canvas，不支持 var(--xxx) 语法，需要解析为实际色值
 */

/**
 * 读取 CSS 变量的实际颜色值
 * @param {string} name - 变量名，如 '--terracotta'
 * @returns {string} 解析后的颜色值，如 '#C89F85'
 */
export function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/**
 * 将 CSS 变量数组批量解析为实际颜色值
 * @param {string[]} vars - 变量名数组，如 ['--terracotta', '--amber']
 * @returns {string[]} 解析后的颜色值数组
 */
export function resolveCssVars(vars) {
  return vars.map(getCssVar)
}

/**
 * 将颜色附加透明度（hex → hex+alpha，或直接返回 rgba）
 * @param {string} color - 颜色值，如 '#C89F85'
 * @param {number} alpha - 透明度 0-100
 * @returns {string} 带透明度的颜色值
 */
export function withAlpha(color, alpha) {
  if (!color) return color
  // hex 颜色：追加两位 alpha
  if (color.startsWith('#')) {
    const hex = Math.round((alpha / 100) * 255).toString(16).padStart(2, '0')
    return color + hex
  }
  // rgb/rgba：替换 alpha
  const match = color.match(/rgba?\(([^)]+)\)/)
  if (match) {
    const parts = match[1].split(',').map(s => s.trim())
    return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha / 100})`
  }
  return color
}

/**
 * 解析 CSS 变量并附加透明度
 * @param {string} varName - 变量名，如 '--terracotta'
 * @param {number} alpha - 透明度 0-100
 */
export function cssVarAlpha(varName, alpha) {
  return withAlpha(getCssVar(varName), alpha)
}