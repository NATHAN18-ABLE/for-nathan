import { Fragment } from "react";

// Longest phrase kept unbroken; anything longer wraps between words as usual,
// so a narrow phone never pushes a line off the screen.
const MAX_CHARS = 30;

/** Lets a short sentence wrap only after its commas and full stops. */
export function Phrases({ text }: { text: string }) {
  const parts = text.split(/(?<=[.,!?])\s+/);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          {part.length <= MAX_CHARS ? <span className="phrase">{part}</span> : part}
        </Fragment>
      ))}
    </>
  );
}
