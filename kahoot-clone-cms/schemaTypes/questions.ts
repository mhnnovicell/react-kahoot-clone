import {defineType, defineField, defineArrayMember} from 'sanity'

export const questions = defineType({
  type: 'document',
  name: 'questions',
  title: 'Questions',
  fields: [
    defineField({
      type: 'string',
      name: 'title',
    }),
    defineField({
      type: 'slug',
      name: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    }),
    defineField({
      type: 'array',
      name: 'Questions',
      of: [
        defineArrayMember({
          type: 'question',
        }),
      ],
    }),
  ],
})
