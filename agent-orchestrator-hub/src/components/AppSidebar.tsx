import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Bot, MessageSquare, GitBranch, 
  Scale, Zap, Settings, ChevronLeft, ChevronRight,
  MessageCircle, FileCode,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { path: '/agents', label: 'الوكلاء', icon: Bot },
  { path: '/chat', label: 'المحادثة', icon: MessageSquare },
  { path: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { path: '/compare', label: 'المقارنة', icon: Scale },
  { path: '/dialogue', label: 'حوار آلي', icon: MessageCircle },
  { path: '/api-docs', label: 'توثيق API', icon: FileCode },
  { path: '/settings', label: 'الإعدادات', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2 }}
      className="h-screen sticky top-0 flex flex-col bg-sidebar border-l border-sidebar-border"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
            <h1 className="text-lg font-bold text-foreground whitespace-nowrap">وكيل بلس</h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5">AI Orchestration</p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
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
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {!collapsed && <span className="text-xs">طي القائمة</span>}
        </button>
      </div>
    </motion.aside>
  );
}
