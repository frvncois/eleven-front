import { StageScale } from "@/components/shell/StageScale";
import { SmoothScroll } from "@/components/shell/SmoothScroll";
import { PageTransition } from "@/components/shell/PageTransition";
import { CursorTag } from "@/components/shell/CursorTag";

/** Everything behind the password: one stage, one Lenis, one sweep, one cursor tag for the whole visit. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StageScale />
      <SmoothScroll />
      <div className="stage">
        {children}
        <CursorTag />
      </div>
      <PageTransition />
    </>
  );
}
