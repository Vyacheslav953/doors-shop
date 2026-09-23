import type { GlobalConfig } from 'payload'
import { ValidationError } from 'payload'

import { checkExcelPath, resolveExcelPath, saveExcelPathMirror } from '../lib/excelPath'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Настройки сайта',
  // Сайт читает настройки через серверный API, а публичный REST не нужен: здесь есть пути к файлам сервера
  access: { read: ({ req }) => Boolean(req.user) },
  hooks: {
    beforeChange: [
      ({ data }) => {
        const p = typeof data?.leadsExcelPath === 'string' ? data.leadsExcelPath.trim() : ''
        if (p) {
          const problem = checkExcelPath(p)
          if (problem) throw new ValidationError({ errors: [{ message: problem, path: 'leadsExcelPath' }] })
        }
        return data
      },
    ],
    afterChange: [
      ({ doc }) => {
        saveExcelPathMirror(doc?.leadsExcelPath)
        return doc
      },
    ],
  },
  fields: [
    { name: 'phone', type: 'text', required: true, defaultValue: '+7 (495) 000-00-00', label: 'Телефон' },
    { name: 'workHours', type: 'text', defaultValue: 'Ежедневно с 9:00 до 20:00', label: 'Часы работы' },
    {
      name: 'markupPercent',
      type: 'number',
      required: true,
      defaultValue: 30,
      min: 0,
      label: 'Общая наценка на цену завода, %',
    },
    {
      name: 'installPrice',
      type: 'number',
      required: true,
      defaultValue: 3500,
      min: 0,
      label: 'Монтаж одной двери, ₽ (Москва и Подмосковье)',
    },
    {
      name: 'customSize',
      type: 'group',
      label: 'Свой размер полотна',
      admin: {
        description:
          'Готовые размеры двери доплаты не имеют. Если посетитель выбирает на шкале другой размер, к цене добавляется доплата: фиксированная часть плюс надбавка за сантиметры сверх самого большого готового размера.',
      },
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true, label: 'Разрешить выбор своего размера' },
        { name: 'minWidth', type: 'number', defaultValue: 550, min: 300, label: 'Ширина от, мм' },
        { name: 'maxWidth', type: 'number', defaultValue: 1000, label: 'Ширина до, мм' },
        { name: 'minHeight', type: 'number', defaultValue: 1900, min: 1000, label: 'Высота от, мм' },
        { name: 'maxHeight', type: 'number', defaultValue: 2400, label: 'Высота до, мм' },
        {
          name: 'fee',
          type: 'number',
          defaultValue: 3000,
          min: 0,
          label: 'Фиксированная доплата за нестандартный размер, ₽',
        },
        {
          name: 'perCm',
          type: 'number',
          defaultValue: 100,
          min: 0,
          label: 'Надбавка за каждый см сверх самого большого готового размера, ₽',
          admin: { description: 'Считается отдельно по ширине и по высоте. 0 = только фиксированная доплата.' },
        },
      ],
    },
    {
      name: 'deliveryZones',
      type: 'array',
      label: 'Доставка своими силами',
      labels: { singular: 'Зона', plural: 'Зоны' },
      admin: { description: 'Москва и Подмосковье. В другие регионы доставка ТК, цену называет менеджер.' },
      fields: [
        { name: 'label', type: 'text', required: true, label: 'Название зоны' },
        {
          name: 'region',
          type: 'select',
          required: true,
          label: 'Где',
          options: [
            { label: 'Москва', value: 'moscow' },
            { label: 'Подмосковье', value: 'mo' },
          ],
        },
        { name: 'price', type: 'number', required: true, min: 0, label: 'Стоимость, ₽' },
      ],
    },
    {
      name: 'regionNote',
      type: 'textarea',
      defaultValue: 'В другие регионы доставляем транспортной компанией. Стоимость рассчитает менеджер после звонка.',
      label: 'Текст про доставку в регионы',
    },
    {
      name: 'leadsExcelPath',
      type: 'text',
      label: 'Путь к Excel-файлу с заявками',
      admin: {
        description:
          'Полный путь к файлу, например D:\\Заявки\\leads.xlsx. Оставьте пустым, чтобы использовать файл по умолчанию (папка data внутри проекта). ' +
          'Папка создаётся сама. Новая заявка дописывается в файл, старые строки остаются на месте: при смене пути они не переносятся.',
      },
    },
    {
      name: 'leadsExcelCurrent',
      type: 'text',
      virtual: true,
      label: 'Сейчас заявки записываются в',
      admin: { readOnly: true },
      hooks: {
        afterRead: [({ req }) => (req.user ? resolveExcelPath() : undefined)],
      },
    },
  ],
}
