import { PageHeader } from '@/components/PageHeader';
import { useAgentStore } from '@/store/agentStore';
import { Bot, MessageSquare, GitBranch, Zap, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { AI_PROVIDERS } from '@/types';
import { Link } from 'react-router-dom';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { agents, pipelines, conversations } = useAgentStore();

  const stats = [
    { label: 'الوكلاء', value: agents.length, icon: Bot, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'المحادثات', value: conversations.length, icon: MessageSquare, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Pipelines', value: pipelines.length, icon: GitBranch, color: 'text-chart-3', bg: 'bg-chart-3/10' },
    { label: 'عمليات التنفيذ', value: 0, icon: Activity, color: 'text-chart-4', bg: 'bg-chart-4/10' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl pt-14 md:pt-6 lg:pt-8">
      <PageHeader title="لوحة التحكم" description="نظرة عامة على منصة وكيل بلس" />

      {/* Stats */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8"
      >
        {stats.map((s) => (
          <motion.div key={s.label} variants={item} className="glass-card p-3 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 md:w-10 h-8 md:h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={container} initial="hidden" animate="show" className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={item}>
            <Link to="/agents" className="glass-card p-5 flex items-center gap-4 group hover:border-primary/30 transition-colors block">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:glow-primary transition-shadow">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">إنشاء وكيل جديد</h3>
                <p className="text-sm text-muted-foreground">أضف وكيل ذكي بإعدادات مخصصة</p>
              </div>
            </Link>
          </motion.div>
          <motion.div variants={item}>
            <Link to="/chat" className="glass-card p-5 flex items-center gap-4 group hover:border-accent/30 transition-colors block">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:glow-accent transition-shadow">
                <MessageSquare className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">بدء محادثة</h3>
                <p className="text-sm text-muted-foreground">تحدث مع أحد الوكلاء</p>
              </div>
            </Link>
          </motion.div>
          <motion.div variants={item}>
            <Link to="/pipeline" className="glass-card p-5 flex items-center gap-4 group hover:border-chart-3/30 transition-colors block">
              <div className="w-12 h-12 rounded-xl bg-chart-3/10 flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-chart-3" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">إنشاء Pipeline</h3>
                <p className="text-sm text-muted-foreground">صمم سلسلة عمل بصرياً</p>
              </div>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Recent Agents */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <h2 className="text-lg font-semibold text-foreground mb-4">الوكلاء الأخيرة</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {agents.slice(0, 3).map((agent) => {
            const provider = AI_PROVIDERS.find((p) => p.id === agent.modelProvider);
            return (
              <div key={agent.id} className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                    {provider?.icon || '🤖'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground">{provider?.name}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
