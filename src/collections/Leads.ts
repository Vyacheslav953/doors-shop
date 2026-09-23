import type { CollectionConfig } from 'payload'

// Заявки создаются только через /api/lead (серверная валидация), поэтому публичного create нет.
// Уведомление в Telegram и запись в Excel тоже делает /api/lead, а не хук: так статус сохранения виден менеджеру.
export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Заявка', plural: 'Заявки' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['createdAt', 'name', 'phone', 'status', 'estimate'],
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      label: 'Статус',
      options: [
        { label: 'Новая', value: 'new' },
        { label: 'Перезвонили', value: 'called' },
        { label: 'Закрыта', value: 'closed' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'name', type: 'text', required: true, label: 'Имя' },
    { name: 'phone', type: 'text', required: true, label: 'Телефон' },
    { name: 'city', type: 'text', label: 'Город' },
    { name: 'door', type: 'relationship', relationTo: 'doors', label: 'Дверь' },
    { name: 'summary', type: 'textarea', label: 'Выбранная конфигурация' },
    { name: 'estimate', type: 'number', label: 'Ориентировочная сумма, ₽' },
    { name: 'config', type: 'json', label: 'Конфигурация (данные)', admin: { readOnly: true } },
    { name: 'managerNote', type: 'textarea', label: 'Заметка менеджера' },
  ],
}
