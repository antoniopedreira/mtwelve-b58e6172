import { LayoutDashboard, Users, Wallet, Settings, Menu } from "lucide-react";
import { NavLink } from "../NavLink";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile"; // CORREÇÃO: Nome correto do hook
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar() {
  const isMobile = useIsMobile(); // CORREÇÃO: Uso correto do hook
  const [isOpen, setIsOpen] = useState(false);

  const LOGO_URL =
    "https://ychhgfsavlnoyjvfpdxa.supabase.co/storage/v1/object/public/logos&templates/0716753f-3c3e-45c8-b90d-64c04940d4b7.png";

  // Estilos centralizados para facilitar manutenção
  const baseLinkStyles =
    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group text-muted-foreground hover:bg-accent hover:text-foreground";
  const activeLinkStyles = "bg-primary/10 text-primary font-medium";

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border/50">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <img src={LOGO_URL} alt="MTwelve Sports" className="h-10 w-auto object-contain" />
        </div>

        {/* Navegação - CORREÇÃO: Ícones passados como children, não props */}
        <nav className="space-y-2">
          <NavLink to="/" className={baseLinkStyles} activeClassName={activeLinkStyles}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/crm" className={baseLinkStyles} activeClassName={activeLinkStyles}>
            <Users size={20} />
            <span>CRM</span>
          </NavLink>

          <NavLink to="/financeiro" className={baseLinkStyles} activeClassName={activeLinkStyles}>
            <Wallet size={20} />
            <span>Financeiro</span>
          </NavLink>

          <NavLink to="/settings" className={baseLinkStyles} activeClassName={activeLinkStyles}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </nav>
      </div>

      {/* Footer / User Profile */}
      <div className="mt-auto p-6 border-t border-border/50">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
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
        <SheetContent side="left" className="p-0 w-72 bg-card border-r border-border/50">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden md:block w-64 h-screen sticky top-0 bg-background">
      <SidebarContent />
    </div>
  );
}
