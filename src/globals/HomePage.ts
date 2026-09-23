import type { GlobalConfig } from 'payload'

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Главная страница',
  fields: [
    {
      name: 'hero',
      type: 'group',
      label: 'Баннер',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Фото баннера',
          admin: {
            description:
              'Горизонтальное фото от 1920×1080 пикселей. Меньшее фото на широком экране получится мягким. Слева фото закрывает светлая подложка под текст, поэтому важные детали лучше держать справа.',
          },
        },
        { name: 'eyebrow', type: 'text', defaultValue: 'Межкомнатные двери', label: 'Надпись над заголовком' },
        {
          name: 'title',
          type: 'textarea',
          defaultValue: 'Двери, которые\nхочется открывать',
          label: 'Заголовок',
          admin: { description: 'Каждая строка с новой строки. Первая строка обычная, остальные выделяются курсивом цвета бронзы.' },
        },
        {
          name: 'subtitle',
          type: 'text',
          defaultValue: 'Подберём модель, привезём и установим. Всё остальное решим одним звонком.',
          label: 'Подзаголовок',
        },
        { name: 'buttonLabel', type: 'text', defaultValue: 'Смотреть каталог', label: 'Текст кнопки' },
        { name: 'buttonLink', type: 'text', defaultValue: '/catalog', label: 'Ссылка кнопки' },
        {
          name: 'overlay',
          type: 'number',
          defaultValue: 70,
          min: 0,
          max: 100,
          label: 'Плотность светлой подложки под текстом, %',
          admin: { description: 'Чем больше, тем лучше читается текст и тем меньше видно фото слева. Обычно 55–80.' },
        },
      ],
    },
  ],
}
