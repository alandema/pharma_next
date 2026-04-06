export const GENDER_OPTIONS = ['Masculino', 'Feminino'] as const
export const TITLE_OPTIONS = ['Dr.', 'Dra.'] as const

export type TitleOption = (typeof TITLE_OPTIONS)[number]

export type GenderOption = (typeof GENDER_OPTIONS)[number]