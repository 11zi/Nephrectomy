import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { BuyRoomPayload, BuyRoomResult, RoomDetail, RoomId, RoomNode, RoomSummary } from '../types/chatTypes'
import { httpChatApi } from '../api/httpChatApi'

export const DEFAULT_ROOM_ID: RoomId = 'plaza'

export const useRoomStore = defineStore('room', () => {
  const rooms = ref<RoomNode[]>([])
  const navStack = ref<RoomNode[]>([])
  const activeRoomId = ref<RoomId>(DEFAULT_ROOM_ID)
  const isLoadingRooms = ref(false)
  const selectedRoomInfo = ref<RoomDetail | null>(null)
  const isLoadingRoomInfo = ref(false)

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
    } catch (err) {
      throw err instanceof Error ? err : new Error(`进入房间失败：${roomId}`)
    }
  }

  async function fetchRoomInfo(roomId: RoomId): Promise<RoomDetail> {
    isLoadingRoomInfo.value = true
    try {
      const detail = await httpChatApi.fetchRoomInfo(roomId)
      selectedRoomInfo.value = detail
      return detail
    } finally {
      isLoadingRoomInfo.value = false
    }
  }

  async function repayRoomLoan(roomId: RoomId, amount: number): Promise<RoomDetail> {
    const detail = await httpChatApi.repayRoomLoan(roomId, amount)
    selectedRoomInfo.value = detail
    return detail
  }

  async function buyRoom(payload: BuyRoomPayload): Promise<BuyRoomResult> {
    const result = await httpChatApi.buyRoom(payload)
    await fetchRoomList()
    return result
  }

  function setActiveRoom(roomId?: RoomId | null): void {
    activeRoomId.value = roomId || DEFAULT_ROOM_ID
  }

  return {
    rooms,
    navStack,
    activeRoomId,
    currentRooms,
    selectedRoomInfo,
    isLoadingRooms,
    isLoadingRoomInfo,
    fetchRoomList,
    enterRoom,
    fetchRoomInfo,
    repayRoomLoan,
    buyRoom,
    setActiveRoom,
  }
})
