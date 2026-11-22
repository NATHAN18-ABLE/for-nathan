import { Fragment } from "react";

/**
 * Lets text wrap only after its commas, semicolons and full stops: a sentence or clause that
 * fits on a line moves to the next line whole instead of leaving a word or two
 * behind. A clause wider than the line still wraps between its own words.
 * A line separator (U+2028) in the text marks one more place the line may break, for a sentence
 * that reads better split in two where it has no comma.
 */
export function Phrases({ text }: { text: string }) {
  const parts = text.split(/(?<=[.,;:!?。、])\s+|\s*\u2028\s*/);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span className="phrase">{part}</span>
        </Fragment>
      ))}
    </>
  );
}
