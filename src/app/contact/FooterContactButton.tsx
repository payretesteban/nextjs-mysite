"use client";

import { useContact } from "./ContactProvider";
import { Icon } from "../command-menu";

/** Footer "email" button: opens the contact form instead of a mailto: link (no exposed address, spam-protected). */
export default function FooterContactButton({ className }: { className: string }) {
  const contact = useContact();
  return (
    <button
      type="button"
      onClick={() => contact?.open()}
      aria-haspopup="dialog"
      aria-label="Send me a message"
      title="Send me a message"
      className={className}
    >
      <Icon name="mail" className="h-[18px] w-[18px]" />
    </button>
  );
}
