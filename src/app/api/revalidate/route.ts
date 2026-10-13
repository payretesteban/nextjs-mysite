import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { SANITY_TAG } from "@/sanity/fetch";

/**
 * Called by a Sanity webhook whenever content is published, changed or deleted. Checks the webhook's
 * signature (secret in the SANITY_REVALIDATE_SECRET env var), then expires every cached Sanity request so
 * the next visitor sees the change. Anything else gets a 401; without the secret set, it does nothing.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Revalidation isn't set up (SANITY_REVALIDATE_SECRET missing)." }, { status: 503 });
  }
  try {
    // Waits briefly so Sanity's API already returns the new content when pages are rebuilt
    const { isValidSignature, body } = await parseBody<{ _type?: string }>(req, secret, true);
    if (!isValidSignature) {
      return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 401 });
    }
    revalidateTag(SANITY_TAG, { expire: 0 });
    console.log(`[revalidate] Content changed${body?._type ? ` (${body._type})` : ""}; refreshed every page.`);
    return NextResponse.json({ ok: true, revalidated: SANITY_TAG, type: body?._type ?? null });
  } catch (error) {
    console.error("[revalidate] Couldn't handle the webhook:", error);
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
}
