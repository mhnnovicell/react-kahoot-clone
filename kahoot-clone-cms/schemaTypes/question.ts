import {defineType, defineField, defineArrayMember} from 'sanity'

export const question = defineType({
  type: 'document',
  name: 'question',
  title: 'Question',
  fields: [
    defineField({
      type: 'string',
      name: 'answer',
    }),
    defineField({
      type: 'slug',
      name: 'slug',
      options: {
        source: 'answer',
        maxLength: 96,
      },
    }),
    defineField({
      type: 'image',
      name: 'image',
      options: {hotspot: true},
    }),
    defineField({
      type: 'boolean',
      name: 'korrekt',
      title: 'Korrekt svar',
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Baggrundsfarve',
      type: 'color',
    }),
  ],
})
