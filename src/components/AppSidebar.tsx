import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Bot, MessageSquare, GitBranch,
  Scale, Zap, Settings, ChevronLeft, ChevronRight,
  MessageCircle, FileCode, Menu, X, Globe,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18nStore } from '@/store/i18nStore';

const navItems = [
  { path: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { path: '/agents', labelKey: 'nav.agents', icon: Bot },
  { path: '/chat', labelKey: 'nav.chat', icon: MessageSquare },
  { path: '/pipeline', labelKey: 'nav.pipeline', icon: GitBranch },
  { path: '/compare', labelKey: 'nav.compare', icon: Scale },
  { path: '/dialogue', labelKey: 'nav.dialogue', icon: MessageCircle },
  { path: '/api-docs', labelKey: 'nav.apiDocs', icon: FileCode },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { t, locale } = useI18nStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // إغلاق القائمة عند تغيير المسار
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // إغلاق عند تغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 md:h-16 border-b border-sidebar-border shrink-0">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden min-w-0">
            <h1 className="text-base md:text-lg font-bold text-foreground whitespace-nowrap">{t('app.brandName')}</h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5">AI Orchestration</p>
          </motion.div>
        )}
        {/* زر إغلاق الجوال */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden ml-auto p-1 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 md:py-4 px-2 space-y-0.5 md:space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/15 text-primary glow-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
              {!collapsed && <span className="whitespace-nowrap truncate">{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Language Toggle + Collapse */}
      <div className="p-2 border-t border-sidebar-border shrink-0 space-y-1">
        <button
          onClick={() => useI18nStore.getState().toggleLocale()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
        >
          <Globe className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-xs">{t('app.language')}</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent transition-colors hidden md:flex"
        >
          {collapsed
            ? <ChevronLeft className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />
          }
          {!collapsed && <span className="text-xs">{t('nav.collapse')}</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ===== زر hamburger للجوال ===== */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 right-3 z-50 w-10 h-10 rounded-xl bg-sidebar border border-sidebar-border flex items-center justify-center shadow-lg hover:bg-sidebar-accent transition-colors"
        aria-label={t('app.openMenu')}
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* ===== Sidebar على سطح المكتب ===== */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.2 }}
        className="h-screen sticky top-0 hidden md:flex flex-col bg-sidebar border-l border-sidebar-border"
      >
        {navContent}
      </motion.aside>

      {/* ===== Drawer للجوال ===== */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: locale === 'ar' ? 280 : -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: locale === 'ar' ? 280 : -280, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                "md:hidden fixed top-0 bottom-0 z-50 w-[260px] flex flex-col bg-sidebar border-sidebar-border",
                locale === 'ar' ? 'right-0 border-l' : 'left-0 border-r'
              )}
            >
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
