import { describe, expect, it } from 'vitest'
import { validateProfile } from '../../types/accountTypes'
import type { AccountProfile } from '../../types/accountTypes'

const validProfile: AccountProfile = {
  uid: 'user-test',
  avatarUrl: '',
  nickname: '哈米斯基',
  motto: '',
  gender: true,
  birthday: '',
  age: -1,
  address: '',
  hobbies: [],
  friends: [],
  email: '',
  website: '',
  community: '',
  titles: [],
  likes: 0,
  following: [],
  followers: [],
  money: 0,
  bankDeposit: 0,
  stockShares: 0,
  stockAutoBuyPrice: null,
  stockAutoSellPrice: null,
  albums: [],
  visitCount: 0,
  accountStatus: 0,
  isOnline: false,
  presenceStatus: '',
  presenceDetail: '',
  presenceUntil: null,
  currentRoom: 'plaza',
  lastOnline: '',
  onlineDuration: 0,
  registeredAt: '',
  peerId: '',
}

describe('validateProfile', () => {
  it('accepts a minimal valid profile', () => {
    expect(validateProfile(validProfile)).toEqual([])
  })

  it('requires nickname', () => {
    const errors = validateProfile({ ...validProfile, nickname: '   ' })
    expect(errors).toContainEqual({
      field: 'nickname',
      message: '昵称不能为空',
    })
  })

  it('validates optional contact fields when provided', () => {
    const errors = validateProfile({
      ...validProfile,
      email: 'bad-email',
      website: 'not-a-url',
    })
    expect(errors.map((e) => e.field)).toEqual(['email', 'website'])
  })
})
