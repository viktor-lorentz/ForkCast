/**
 * The ForkCast logo: icon + two-tone name, sized by the surrounding font size.
 * The cloud lines up with the capital letters: its bottom sits on the text baseline and its top
 * meets the cap height, at any font size. Numbers: the cloud is rows 61-253 of the 256px-tall
 * logo-mark-tight.png (293px wide), and Geist Bold's cap height is 0.726em (measured in the browser).
 * Image height = 0.726 / (193/256) = 0.963em; the 2px under the cloud is 0.0075em.
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
        style={{ height: "0.963em", width: "1.102em", verticalAlign: "-0.0075em", marginRight: "0.16em" }}
      />
      <span className="text-stone-900">Fork</span>
      <span className="text-cardinal">Cast</span>
    </span>
  );
}
