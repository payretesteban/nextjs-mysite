import { defineQuery } from "next-sanity";

export const settingsQuery = defineQuery(`
  *[_type == "siteSettings"][0]{
    title,
    description
    } 
`);