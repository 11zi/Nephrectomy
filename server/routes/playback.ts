import { Router } from 'express'
import { Room } from '../models/Room'
import { authRequired } from '../auth/middleware'
import {
  addMediaToQueue,
  getPlaybackState,
  markCurrentMediaEnded,
  voteRemoveMedia,
} from '../playback/service'
import { emitRoomPlaybackState } from '../realtime'

const router = Router()

async function ensureRoomExists(roomId: string): Promise<boolean> {
  const room = await Room.findOne({ roomId }).lean()
  return Boolean(room)
}

router.get('/:roomId/playback', authRequired, async (req, res) => {
  try {
    const roomId = String(req.params.roomId)
    if (!await ensureRoomExists(roomId)) return res.status(404).json({ error: '房间不存在' })

    res.json(getPlaybackState(roomId))
  } catch (err) {
    res.status(500).json({ error: '获取点播状态失败' })
  }
})

router.post('/:roomId/playback/queue', authRequired, async (req, res) => {
  try {
    const roomId = String(req.params.roomId)
    if (!await ensureRoomExists(roomId)) return res.status(404).json({ error: '房间不存在' })

    const playback = addMediaToQueue(roomId, String(req.body?.url ?? ''), String(req.userId))
    const item = playback.queue.find(queueItem => queueItem.id === playback.itemId)
    emitRoomPlaybackState(roomId, playback)

    res.status(201).json({
      ok: true,
      item,
      playback,
    })
  } catch (err) {
    res.status(400).json({
      ok: false,
      error: err instanceof Error ? err.message : '媒体解析失败',
    })
  }
})

router.post('/:roomId/playback/queue/:itemId/vote-remove', authRequired, async (req, res) => {
  try {
    const roomId = String(req.params.roomId)
    if (!await ensureRoomExists(roomId)) return res.status(404).json({ error: '房间不存在' })

    const result = voteRemoveMedia(roomId, String(req.params.itemId), String(req.userId))
    emitRoomPlaybackState(roomId, result)

    res.json({
      ok: true,
      itemRemoved: result.itemRemoved,
      voteAdded: result.voteAdded,
      requesterCut: result.requesterCut,
      playback: result,
    })
  } catch (err) {
    res.status(400).json({
      ok: false,
      error: err instanceof Error ? err.message : '投票失败',
    })
  }
})

router.post('/:roomId/playback/current-ended', authRequired, async (req, res) => {
  try {
    const roomId = String(req.params.roomId)
    if (!await ensureRoomExists(roomId)) return res.status(404).json({ error: '房间不存在' })

    const playback = markCurrentMediaEnded(roomId, String(req.body?.itemId ?? ''))
    emitRoomPlaybackState(roomId, playback)

    res.json({
      ok: true,
      playback,
    })
  } catch (err) {
    res.status(400).json({
      ok: false,
      error: err instanceof Error ? err.message : '切换点播失败',
    })
  }
})

export default router
