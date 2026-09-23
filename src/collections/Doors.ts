import type { CollectionConfig } from 'payload'

import { slugify } from '../lib/slug'

export const Doors: CollectionConfig = {
  slug: 'doors',
  labels: { singular: 'Дверь', plural: 'Двери' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'article', 'series', 'factoryPrice', 'published'],
  },
  access: {
    read: ({ req }) => (req.user ? true : { published: { equals: true } }),
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && data.name) {
          data.slug = slugify(`${data.name} ${data.article ?? ''}`)
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Название' },
    {
      name: 'article',
      type: 'text',
      unique: true,
      index: true,
      label: 'Артикул',
      admin: { description: 'По артикулу будет работать импорт прайса из Excel.' },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      label: 'Адрес страницы',
      admin: { position: 'sidebar', description: 'Заполняется автоматически.' },
    },
    { name: 'published', type: 'checkbox', defaultValue: true, label: 'Показывать на сайте', admin: { position: 'sidebar' } },
    {
      name: 'bestseller',
      type: 'checkbox',
      defaultValue: false,
      label: 'Хит продаж',
      admin: { position: 'sidebar', description: 'Дверь попадёт в карусель «Хит продаж» на главной.' },
    },
    {
      name: 'promo',
      type: 'checkbox',
      defaultValue: false,
      label: 'Акция',
      admin: {
        position: 'sidebar',
        description: 'На фото двери появится красная лента «Акция»: в каталоге, на главной и на странице двери.',
      },
    },
    {
      name: 'factory',
      type: 'relationship',
      relationTo: 'factories',
      label: 'Фабрика',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Дверь показывается в каталоге внутри выбранной фабрики. Без фабрики она в каталог не попадёт.',
      },
    },
    { name: 'series', type: 'text', label: 'Коллекция / серия', index: true },
    { name: 'description', type: 'textarea', label: 'Описание' },
    { name: 'photos', type: 'upload', relationTo: 'media', hasMany: true, label: 'Фотографии' },
    {
      name: 'factoryPrice',
      type: 'number',
      required: true,
      min: 0,
      label: 'Цена завода (закупочная), ₽',
      admin: { description: 'На сайте показывается цена с наценкой из «Настроек сайта».' },
    },
    {
      name: 'markupPercent',
      type: 'number',
      label: 'Своя наценка, %',
      admin: { description: 'Оставьте пустым, чтобы использовать общую наценку.' },
    },
    {
      name: 'sizes',
      type: 'array',
      label: 'Готовые размеры полотна',
      labels: { singular: 'Размер', plural: 'Размеры' },
      admin: {
        description:
          'Размеры, которые завод производит серийно: доплаты за них нет. Свой размер посетитель выбирает на шкале с доплатой, правила в «Настройках сайта».',
      },
      fields: [
        { name: 'width', type: 'number', required: true, label: 'Ширина, мм' },
        { name: 'height', type: 'number', required: true, label: 'Высота, мм' },
        // Устарело: за готовые размеры доплаты нет. Поле оставлено в схеме, чтобы не менять базу, на сайте не используется.
        { name: 'extra', type: 'number', defaultValue: 0, admin: { hidden: true } },
      ],
    },
    { name: 'colors', type: 'relationship', relationTo: 'colors', hasMany: true, label: 'Доступные цвета' },
    {
      name: 'specs',
      type: 'array',
      label: 'Характеристики',
      labels: { singular: 'Характеристика', plural: 'Характеристики' },
      fields: [
        { name: 'label', type: 'text', required: true, label: 'Название' },
        { name: 'value', type: 'text', required: true, label: 'Значение' },
      ],
    },
  ],
}
