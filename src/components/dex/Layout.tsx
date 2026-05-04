import { Outlet } from "react-router-dom";
import { Header } from "@/components/dex/Header";

const Layout = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <div className="flex-1">
      <Outlet />
    </div>
    <footer className="mt-20">
      <div className="hairline" />
      <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-mono text-muted-foreground uppercase tracking-[0.18em]">
        <div>Silverway · Built on LitVM</div>
        <div className="flex items-center gap-6">
          <a href="https://docs.litvm.com/" target="_blank" rel="noopener" className="hover:text-foreground transition-colors">Docs</a>
          <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
          <a href="#" className="hover:text-foreground transition-colors">Telegram</a>
          <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  </div>
);

export default Layout;
