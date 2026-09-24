/**
 * The site's canonical address, without a trailing slash.
 * estebanpayret.com redirects to www, so www is what search engines should see.
 */
export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.estebanpayret.com").replace(/\/+$/, "");
