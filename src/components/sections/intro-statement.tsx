import { ScrollHighlight } from "@/components/animations/scroll-highlight";
import { statement } from "@/config/content";

/** The approach, set large on Mist: words light up in navy as you read down the page. */
export function IntroStatement() {
  return (
    <div className="shell section-y pb-0">
      <ScrollHighlight
        // Dim words stay at 3.3:1 on Mist (WCAG large-text minimum is 3:1): readable even if
        // someone stops scrolling halfway through the sweep.
        dim={{ opacity: 1, color: "rgb(7 27 53 / 0.5)" }}
        lit={{ opacity: 1, color: "rgb(7 27 53 / 1)" }}
        className="font-display max-w-[22ch] text-[clamp(2rem,4.6vw,4.75rem)] leading-[1.02] tracking-[-0.035em] lg:ml-[calc(100%/12)]"
      >
        {statement}
      </ScrollHighlight>
    </div>
  );
}
