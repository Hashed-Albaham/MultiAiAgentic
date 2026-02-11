import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6 md:mb-8"
    >
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-0.5 md:mt-1 text-xs md:text-sm">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </motion.div>
  );
}
