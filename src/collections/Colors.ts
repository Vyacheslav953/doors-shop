import type { CollectionConfig } from 'payload'

export const Colors: CollectionConfig = {
  slug: 'colors',
  labels: { singular: 'Цвет', plural: 'Цвета' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'hex', 'extra'] },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Название' },
    {
      name: 'hex',
      type: 'text',
      label: 'Цвет для образца (#RRGGBB)',
      admin: { description: 'Если нет фото образца, на сайте покажется кружок этого цвета.' },
    },
    { name: 'swatch', type: 'upload', relationTo: 'media', label: 'Фото образца' },
    {
      name: 'extra',
      type: 'number',
      defaultValue: 0,
      label: 'Доплата за цвет, ₽',
    },
  ],
}
