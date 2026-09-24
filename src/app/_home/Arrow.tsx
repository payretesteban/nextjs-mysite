/** Small "→" used by the "See all …" links; nudges right when its parent link (.group) is hovered. */
export default function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
