import { describe, expect, it } from 'vitest'
import { validateProfile } from '../../types/accountTypes'
import type { AccountProfile } from '../../types/accountTypes'

const validProfile: AccountProfile = {
  avatar: '',
  nickname: '哈米斯基',
  status: '',
  gender: 'undisclosed',
  birthday: '',
  address: '',
  hobbies: [],
  friends: [],
  email: '',
  website: '',
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

    expect(errors.map(error => error.field)).toEqual(['email', 'website'])
  })
})
