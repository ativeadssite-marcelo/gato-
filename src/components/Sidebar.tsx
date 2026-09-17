import React, { useState, useEffect } from 'react';
import { 
  Home,
  Search,
  Car,
  Boxes,
  ClipboardList,
  FileText, 
  Users,
  Building2,
  TrendingUp,
  Settings,
  X,
  FileDown,
  Wrench,
  Sparkles,
  RefreshCw,
  Store,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Zap,
  Globe,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { GatoBrand } from './GatoBrand';
import { UserSession, BranchUnit, CompanyProfile } from '../types';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  unregisteredCount?: number;
  lowStockCount?: number;
  userSession?: UserSession | null;
  companyProfile?: CompanyProfile | null;
  activeBranch?: BranchUnit;
  onOpenTrocaFilial?: () => void;
  onOpenLogin?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isOpenMobile,
  onCloseMobile,
  unregisteredCount = 0,
  lowStockCount = 0,
  userSession,
  companyProfile,
  activeBranch,
  onOpenTrocaFilial,
  onOpenLogin,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse: externalOnToggleCollapse,
}) => {
  // Local collapse state with localStorage persistence if not controlled externally
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gato_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (externalOnToggleCollapse) {
      externalOnToggleCollapse();
    } else {
      setInternalCollapsed(prev => {
        const next = !prev;
        try {
          localStorage.setItem('gato_sidebar_collapsed', String(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  };
  // Primary items matching standard navigation with Início and Consulta de Peças
  const primaryNavItems = [
    {
      id: 'dashboard',
      label: 'Início',
      icon: Home,
      aliases: ['dashboard', 'home', 'inicio'],
    },
    {
      id: 'consulta-aplicacao',
      label: 'Consulta de Peças',
      icon: Search,
      aliases: ['consulta-aplicacao', 'consulta-pecas'],
    },
    {
      id: 'frota',
      label: 'Veículos',
      icon: Car,
      aliases: ['frota'],
    },
    {
      id: 'estoque',
      label: 'Estoque',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount}` : undefined,
      aliases: ['estoque'],
    },
    {
      id: 'cotacao',
      label: 'Vendas',
      icon: ClipboardList,
      aliases: ['cotacao', 'nfe-venda'],
    },
    {
      id: 'clientes-orcamentos',
      label: 'Orçamentos',
      icon: FileText,
      aliases: ['clientes-orcamentos'],
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: Users,
      aliases: ['clientes', 'clientes-orcamentos'],
    },
    {
      id: 'fornecedores',
      label: 'Fornecedores',
      icon: Building2,
      aliases: ['fornecedores', 'pedidos'],
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: TrendingUp,
      aliases: ['relatorios', 'financeiro'],
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
      aliases: ['configuracoes', 'empresa-filiais'],
    },
  ];

  // Secondary quick utilities
  const secondaryNavItems = [
    {
      id: 'xml-import',
      label: 'Baixar NF-e / XML',
      icon: FileDown,
      badge: unregisteredCount > 0 ? `${unregisteredCount}` : undefined,
    },
    {
      id: 'ordem-servico',
      label: 'Ordem de Serviço (OS)',
      icon: Wrench,
    },
  ];

  const handleSelect = (viewId: string) => {
    onSelectView(viewId);
    onCloseMobile();
  };

  const isItemActive = (item: typeof primaryNavItems[0]) => {
    if (currentView === item.id) return true;
    if (item.aliases && item.aliases.includes(currentView)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Navigation Drawer */}
      <aside 
        id="gato-sidebar"
        className={`fixed lg:sticky top-0 lg:top-16 left-0 z-50 lg:z-10 h-full lg:h-[calc(100vh-4rem)] bg-[#111827] text-slate-200 flex flex-col border-r border-slate-800 shadow-xl transition-all duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}`}
      >
        {/* Sidebar Brand Header matching screenshot */}
        <div className={`p-4 flex items-center border-b border-slate-800/80 transition-all ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          <div 
            className="cursor-pointer overflow-hidden flex items-center" 
            onClick={() => handleSelect('dashboard')}
            title="GATO Auto Peças - Início"
          >
            <GatoBrand size="md" showSubtitle={!isCollapsed} iconOnly={isCollapsed} variant="dark" />
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop Collapse Toggle Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              title={isCollapsed ? 'Expandir barra de menu' : 'Recolher barra de menu'}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-[#EA580C]" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Primary Navigation Links matching screenshot */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-1">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleSelect(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full text-left flex items-center rounded-xl text-sm font-medium transition-all cursor-pointer relative ${
                  isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-3'
                } ${
                  isActive 
                    ? 'bg-[#EA580C] text-white shadow-sm font-semibold' 
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-3.5'}`}>
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white text-[#EA580C]' : 'bg-[#EA580C] text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {/* Collapsed dot badge indicator */}
                {isCollapsed && item.badge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EA580C] ring-2 ring-[#111827]" />
                )}
              </button>
            );
          })}

          {/* Quick utility divider */}
          <div className="pt-3 pb-1 px-1">
            <div className="border-t border-slate-800" />
          </div>

          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleSelect(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full text-left flex items-center rounded-xl text-xs font-medium transition-all cursor-pointer relative ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5'
                } ${
                  isActive 
                    ? 'bg-slate-800 text-white font-semibold' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950">
                    {item.badge}
                  </span>
                )}
                {isCollapsed && item.badge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#111827]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Status matching Store & Operator */}
        <div className="p-2.5 border-t border-slate-800 bg-[#0B0F19] text-xs space-y-2">
          {activeBranch && (
            <div 
              onClick={onOpenTrocaFilial}
              className={`p-2 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 flex items-center cursor-pointer transition ${
                isCollapsed ? 'justify-center' : 'justify-between'
              }`}
              title={isCollapsed ? `${activeBranch.name} (${activeBranch.uf}) - Trocar Loja` : 'Trocar Loja / CD Ativo'}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Store className="w-4 h-4 text-[#EA580C] shrink-0" />
                {!isCollapsed && (
                  <div className="truncate">
                    <p className="font-bold text-white text-xs truncate">{activeBranch.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">SEFAZ {activeBranch.uf} • {activeBranch.cdCode}</p>
                  </div>
                )}
              </div>
              {!isCollapsed && <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
            </div>
          )}

          {!isCollapsed ? (
            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>SEFAZ Online</span>
              </span>
              <span className="text-slate-400 font-medium">v2.6 Web</span>
            </div>
          ) : (
            <div className="flex justify-center py-1" title="SEFAZ Online v2.6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

