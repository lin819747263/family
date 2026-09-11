/**
 * 将扁平分类列表构建为树形结构
 * @param {Array} allCategories - 所有分类（含 parentId）
 * @param {string} type - 'expense' | 'income'，为空则不过滤
 * @returns {Array} 树形数组，每项含 children
 */
export function buildCategoryTree(allCategories, type) {
  const filtered = type ? allCategories.filter(c => c.type === type) : allCategories
  const map = {}
  const roots = []
  filtered.forEach(c => { map[c.id] = { ...c, children: [] } })
  filtered.forEach(c => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].children.push(map[c.id])
    } else if (!c.parentId) {
      roots.push(map[c.id])
    }
  })
  roots.sort((a, b) => (a.sort || 0) - (b.sort || 0))
  roots.forEach(r => r.children.sort((a, b) => (a.sort || 0) - (b.sort || 0)))
  return roots
}
