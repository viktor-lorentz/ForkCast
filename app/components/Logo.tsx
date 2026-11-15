/**
 * The ForkCast logo: icon + two-tone name, sized by the surrounding font size.
 * The numbers come from the icon (the cloud is the bottom 76% of logo-mark-tight.png) and
 * Geist Bold's cap height (0.726em): the cloud is centered on the capital letters at any size.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-block whitespace-nowrap font-bold tracking-tight ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mark-tight.png"
        alt=""
        aria-hidden
        className="inline-block"
        style={{ height: "1.38em", width: "1.58em", verticalAlign: "-0.164em", marginRight: "0.2em" }}
      />
      <span className="text-stone-900">Fork</span>
      <span className="text-cardinal">Cast</span>
    </span>
  );
}
