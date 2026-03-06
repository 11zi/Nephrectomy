// 全局唯一的 z-index 计数器
// 作为独立模块导出，确保所有 BaseCard 实例共享同一个值
let _zIndex = 8000

export function getNextZIndex(): number {
  return ++_zIndex
}