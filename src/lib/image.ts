import { createImageUrlBuilder } from '@sanity/image-url'
import { client } from '@/sanity/client'

const builder = createImageUrlBuilder(client)

/**
 * Starts an image URL for a Sanity image; chain `.width()`, `.height()` etc. and finish with `.url()`.
 * @param source - A Sanity image field or asset reference.
 */
export function urlFor(source: any) {
  return builder.image(source)
}