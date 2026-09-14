type BackgroundMotifsProps = {
  /** Absolute to the parent instead of fixed to the viewport (home content below the banner). */
  local?: boolean;
};

export function BackgroundMotifs({ local = false }: BackgroundMotifsProps) {
  return (
    <div
      className={local ? "journey-motifs journey-motifs-local" : "journey-motifs"}
      aria-hidden="true"
    >
      <div className="journey-dojang" />
      {/* Decorative SVGs; next/image is not needed for static motifs. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="journey-taegeuk" src="/motifs/taegeuk.svg" alt="" width={520} height={520} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="journey-kicker" src="/motifs/kicker.svg" alt="" width={420} height={540} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="journey-kicker journey-kicker-2"
        src="/motifs/kicker.svg"
        alt=""
        width={320}
        height={420}
      />
    </div>
  );
}
