import { BUILD } from "@/lib/build.ts";
import type { Lang } from "@/lib/hero/copy.ts";

/** A quiet version line in the footer: the same text on two screens means the same site. */
export function BuildTag({ lang }: { lang: Lang }) {
  return (
    <p className="build-tag" translate="no">
      {lang === "ko" ? "버전" : "Version"} {BUILD}
    </p>
  );
}
