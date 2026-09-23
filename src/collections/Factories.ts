import type { CollectionConfig } from 'payload'

import { slugify } from '../lib/slug'

export const Factories: CollectionConfig = {
  slug: 'factories',
  labels: { singular: 'Фабрика', plural: 'Фабрики' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'sortOrder', 'slug'],
  },
  access: { read: () => true },
  defaultSort: 'sortOrder',
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && data.name) data.slug = slugify(data.name)
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Название' },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      label: 'Адрес страницы',
      admin: { position: 'sidebar', description: 'Заполняется автоматически.' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      label: 'Порядок',
      admin: { position: 'sidebar', description: 'Чем меньше число, тем выше фабрика в списке.' },
    },
    { name: 'description', type: 'textarea', label: 'Краткое описание', admin: { description: 'Показывается на карточке фабрики.' } },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Фото для карточки',
      admin: { description: 'Горизонтальное фото (подойдёт интерьер с дверями фабрики или её логотип на светлом фоне).' },
    },
  ],
}
