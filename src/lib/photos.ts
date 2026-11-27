// Dimensions reserve each image's natural aspect ratio before it loads.
export type Photo = {
  file: string
  width: number
  height: number
  title: string
  description?: string
  author?: string
  source?: string
}

export const photos: readonly Photo[] = []
