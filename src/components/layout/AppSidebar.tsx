import { LayoutDashboard, Users, Wallet, Settings, Menu } from "lucide-react";
import { NavLink } from "../NavLink";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar() {
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(false);

  // URL da Logo Oficial da MTwelve
  const LOGO_URL =
    "https://ychhgfsavlnoyjvfpdxa.supabase.co/storage/v1/object/public/logos&templates/0716753f-3c3e-45c8-b90d-64c04940d4b7.png";

  const Content = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-border/50">
      <div className="p-6">
        {/* LOGO UPDATE: Substituído texto por Imagem */}
        <div className="flex items-center gap-3 mb-8">
          <img
            src={LOGO_URL}
            alt="MTwelve Sports"
            className="h-10 w-auto object-contain" // Ajuste de altura para 40px
          />
        </div>

        <nav className="space-y-2">
          <NavLink to="/" icon={<LayoutDashboard size={20} />}>
            Dashboard
          </NavLink>
          <NavLink to="/crm" icon={<Users size={20} />}>
            CRM
          </NavLink>
          <NavLink to="/financeiro" icon={<Wallet size={20} />}>
            Financeiro
          </NavLink>
          <NavLink to="/settings" icon={<Settings size={20} />}>
            Settings
          </NavLink>
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-border/50">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface hover:bg-surface/80 transition-colors cursor-pointer">
          <Avatar className="h-9 w-9 border border-primary/20">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>JM</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">João Martins</span>
            <span className="text-xs text-muted-foreground">Agente Senior</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r border-border/50">
          <Content />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden md:block w-64 h-screen sticky top-0">
      <Content />
    </div>
  );
}
