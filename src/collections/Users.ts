import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Пользователь', plural: 'Пользователи' },
  admin: {
    useAsTitle: 'username',
  },
  // Вход по логину (например, admin); email тоже работает и необязателен
  auth: {
    loginWithUsername: { allowEmailLogin: true, requireEmail: false, requireUsername: false },
  },
  fields: [{ name: 'name', type: 'text', label: 'Имя' }],
}
