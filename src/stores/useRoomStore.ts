import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { RoomId, RoomNode, RoomSummary } from '../types/chatTypes'
import { httpChatApi } from '../api/httpChatApi'

export const DEFAULT_ROOM_ID: RoomId = 'plaza'

// ── mock 房间数据（API 不可用时的降级数据） ──

const mockRooms: RoomNode[] = [
  {
    id: 'plaza',
    name: '广场',
    description: '所有人闲聊的大厅',
    memberCount: 35,
    isActive: true,
    parentId: null,
    cover: '#546e7a',
    colSpan: 2,
    rowSpan: 2,
    children: [],
  },
  {
    id: 'teahouse',
    name: '茶馆',
    description: '品茶闲聊，安静交流',
    memberCount: 12,
    isActive: true,
    parentId: null,
    cover: '#4e6b5e',
    colSpan: 1,
    rowSpan: 1,
    children: [],
  },
]

function findRoomById(nodes: RoomNode[], id: RoomId): RoomNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children.length > 0) {
      const found = findRoomById(node.children, id)
      if (found) return found
    }
  }
  return null
}

export const useRoomStore = defineStore('room', () => {
  const rooms = ref<RoomNode[]>([...mockRooms])
  const navStack = ref<RoomNode[]>([])
  const activeRoomId = ref<RoomId>(DEFAULT_ROOM_ID)
  const isLoadingRooms = ref(false)

  /** 当前面包屑层级可见的房间列表 */
  const currentRooms = computed<RoomNode[]>(() =>
    navStack.value.length === 0
      ? rooms.value
      : navStack.value[navStack.value.length - 1].children,
  )

  /** 显式从 API 获取房间列表（取代初始化时自动发请求） */
  async function fetchRoomList(): Promise<RoomNode[]> {
    isLoadingRooms.value = true
    try {
      const data = await httpChatApi.fetchRoomList()
      if (data.length > 0) rooms.value = data
    } catch {
      // 保持当前值（mock）
    } finally {
      isLoadingRooms.value = false
    }
    return rooms.value
  }

  /** 进入房间：设置活跃房间 ID，返回标准 RoomSummary */
  async function enterRoom(roomId: RoomId, options: { implicit?: boolean } = {}): Promise<RoomSummary> {
    try {
      const summary = await httpChatApi.enterRoom(roomId, options)
      activeRoomId.value = roomId
      return summary
    } catch {
      activeRoomId.value = roomId
      const found = findRoomById(rooms.value, roomId)
      if (!found) throw new Error(`Room ${roomId} not found`)
      return {
        id: found.id,
        name: found.name,
        description: found.description,
        memberCount: found.memberCount,
        isActive: found.isActive,
      }
    }
  }

  function setActiveRoom(roomId?: RoomId | null): void {
    activeRoomId.value = roomId || DEFAULT_ROOM_ID
  }

  return {
    rooms,
    navStack,
    activeRoomId,
    currentRooms,
    isLoadingRooms,
    fetchRoomList,
    enterRoom,
    setActiveRoom,
  }
})
