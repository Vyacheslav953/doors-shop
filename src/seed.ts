// Запуск: npm run seed. Идемпотентен: повторный запуск ничего не дублирует.
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import { fileURLToPath } from 'url'

import config from './payload.config'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const payload = await getPayload({ config })

// Админ
const email = process.env.ADMIN_EMAIL || 'admin@doorsm.local'
const password = process.env.ADMIN_PASSWORD || 'admin'
const username = process.env.ADMIN_USERNAME || 'admin'
const users = await payload.find({ collection: 'users', limit: 1 })
if (users.totalDocs === 0) {
  await payload.create({ collection: 'users', data: { username, email, password, name: 'Администратор' } })
  console.log(`Создан администратор ${username}`)
} else if (!users.docs[0].username) {
  await payload.update({ collection: 'users', id: users.docs[0].id, data: { username } })
  console.log(`Администратору добавлен логин ${username}`)
}

// Настройки сайта (тестовые значения, правятся в админке). Уже заполненные настройки не трогаем.
const currentSettings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
if (!currentSettings.deliveryZones?.length) {
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      phone: '+7 (495) 000-00-00',
      workHours: 'Ежедневно с 9:00 до 20:00',
      markupPercent: 30,
      installPrice: 3500,
      deliveryZones: [
        { label: 'Москва (в пределах МКАД)', region: 'moscow', price: 1500 },
        { label: 'Подмосковье до 30 км от МКАД', region: 'mo', price: 2500 },
        { label: 'Подмосковье 30–60 км от МКАД', region: 'mo', price: 4000 },
        { label: 'Подмосковье дальше 60 км', region: 'mo', price: 6000 },
      ],
    },
  })
}

// Цвета
const colorDefs = [
  { name: 'Слоновая кость', hex: '#F1EBD8', extra: 0 },
  { name: 'Белый матовый', hex: '#F4F4F2', extra: 0 },
  { name: 'Дуб светлый', hex: '#C9A97A', extra: 1500 },
  { name: 'Орех', hex: '#6B4A2F', extra: 1500 },
  { name: 'Серый шёлк', hex: '#A6A39B', extra: 0 },
]
const colorIds: number[] = []
for (const def of colorDefs) {
  const found = await payload.find({ collection: 'colors', where: { name: { equals: def.name } }, limit: 1 })
  colorIds.push(found.docs[0]?.id ?? (await payload.create({ collection: 'colors', data: def })).id)
}

// Демо-двери (без фото). Заменяются реальными через импорт прайса.
const sizes = [
  { width: 600, height: 2000, extra: 0 },
  { width: 700, height: 2000, extra: 0 },
  { width: 800, height: 2000, extra: 0 },
  { width: 900, height: 2000, extra: 0 },
]
const demo = [
  { article: 'DEMO-001', name: 'Классика 01', series: 'Классика', factoryPrice: 9800, bestseller: true },
  { article: 'DEMO-002', name: 'Классика 02', series: 'Классика', factoryPrice: 10400, bestseller: true, promo: true },
  { article: 'DEMO-003', name: 'Классика 03 со стеклом', series: 'Классика', factoryPrice: 12200, bestseller: true },
  { article: 'DEMO-004', name: 'Модерн 01', series: 'Модерн', factoryPrice: 11600, bestseller: true },
  { article: 'DEMO-005', name: 'Модерн 02', series: 'Модерн', factoryPrice: 12900, promo: true },
  { article: 'DEMO-006', name: 'Модерн 03 скрытая', series: 'Модерн', factoryPrice: 15800 },
]
for (const d of demo) {
  const exists = await payload.find({ collection: 'doors', where: { article: { equals: d.article } }, limit: 1 })
  if (exists.totalDocs > 0) continue
  await payload.create({
    collection: 'doors',
    data: {
      ...d,
      description: 'Демонстрационная позиция. Заменится реальным каталогом после импорта прайса.',
      sizes,
      colors: colorIds,
      specs: [
        { label: 'Покрытие', value: 'Экошпон' },
        { label: 'Толщина полотна', value: '36 мм' },
        { label: 'Наполнение', value: 'Сотовый картон' },
      ],
    },
  })
}

// Демо-фото дверей (seed/doors/<артикул>.jpg): только тем, у кого фото ещё нет
for (const d of demo) {
  const file = path.resolve(dirname, `../seed/doors/${d.article}.jpg`)
  if (!fs.existsSync(file)) continue
  const { docs } = await payload.find({ collection: 'doors', where: { article: { equals: d.article } }, limit: 1, depth: 0 })
  const door = docs[0]
  if (!door || door.photos?.length) continue
  const photo = await payload.create({ collection: 'media', data: { alt: d.name }, filePath: file })
  await payload.update({ collection: 'doors', id: door.id, data: { photos: [photo.id] } })
  console.log(`Фото добавлено: ${d.name}`)
}

// Демо-фабрики и распределение демо-дверей по ним (уже назначенную фабрику не меняем)
const factoryDefs = [
  {
    name: 'Фабрика 1',
    description: 'Классические модели',
    sortOrder: 1,
    file: 'fabrika-1.jpg',
    alt: 'Светлый коридор с белыми филёнчатыми дверями',
    articles: ['DEMO-001', 'DEMO-002', 'DEMO-003'],
  },
  {
    name: 'Фабрика 2',
    description: 'Современные модели',
    sortOrder: 2,
    file: 'fabrika-2.jpg',
    alt: 'Светлый интерьер с дверным проёмом',
    articles: ['DEMO-004', 'DEMO-005', 'DEMO-006'],
  },
]
for (const f of factoryDefs) {
  const found = await payload.find({ collection: 'factories', where: { name: { equals: f.name } }, limit: 1, depth: 0 })
  let factory = found.docs[0]
  if (!factory) {
    factory = await payload.create({
      collection: 'factories',
      data: { name: f.name, description: f.description, sortOrder: f.sortOrder },
    })
    console.log(`Создана фабрика: ${f.name}`)
  }
  const cover = path.resolve(dirname, `../seed/factories/${f.file}`)
  if (!factory.image && fs.existsSync(cover)) {
    const photo = await payload.create({ collection: 'media', data: { alt: f.alt }, filePath: cover })
    await payload.update({ collection: 'factories', id: factory.id, data: { image: photo.id } })
  }
  for (const article of f.articles) {
    const { docs } = await payload.find({ collection: 'doors', where: { article: { equals: article } }, limit: 1, depth: 0 })
    if (docs[0] && !docs[0].factory) {
      await payload.update({ collection: 'doors', id: docs[0].id, data: { factory: factory.id } })
      console.log(`${docs[0].name} → ${f.name}`)
    }
  }
}

// Баннер главной: ставим стартовое фото, только если в админке ещё ничего не выбрано
const home = await payload.findGlobal({ slug: 'home-page', depth: 0 })
if (!home.hero?.image) {
  const heroPhoto = await payload.create({
    collection: 'media',
    data: { alt: 'Светлый коридор с белыми дверями и дубовым полом' },
    filePath: path.resolve(dirname, '../seed/hero.jpg'),
  })
  await payload.updateGlobal({ slug: 'home-page', data: { hero: { image: heroPhoto.id } } })
  console.log('Добавлен баннер главной')
}

console.log('Готово.')
process.exit(0)
