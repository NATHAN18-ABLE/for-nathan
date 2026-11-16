import { Fragment } from "react";

/**
 * Lets text wrap only after its commas and full stops: a sentence or clause that
 * fits on a line moves to the next line whole instead of leaving a word or two
 * behind. A clause wider than the line still wraps between its own words.
 */
export function Phrases({ text }: { text: string }) {
  const parts = text.split(/(?<=[.,!?。、])\s+/);
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
