import { SiteHeader } from "../site-header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
