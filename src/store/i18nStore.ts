import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'ar' | 'en';

interface I18nStore {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    toggleLocale: () => void;
    t: (key: string) => string;
    dir: () => 'rtl' | 'ltr';
}

const translations: Record<string, Record<Locale, string>> = {
    // ===== عام =====
    'app.title': { ar: 'مركز تنسيق الوكلاء', en: 'Agent Orchestrator Hub' },
    'app.settings': { ar: 'الإعدادات', en: 'Settings' },
    'app.agents': { ar: 'الوكلاء', en: 'Agents' },
    'app.chat': { ar: 'المحادثة', en: 'Chat' },
    'app.compare': { ar: 'مقارنة', en: 'Compare' },
    'app.dialogue': { ar: 'حوار', en: 'Dialogue' },
    'app.pipeline': { ar: 'Pipeline', en: 'Pipeline' },
    'app.language': { ar: 'English', en: 'العربية' },

    // ===== Pipeline =====
    'pipeline.title': { ar: 'محرر Pipeline', en: 'Pipeline Editor' },
    'pipeline.subtitle': { ar: 'صمم مسار الرسائل بين الوكلاء بصرياً', en: 'Visually design message flow between agents' },
    'pipeline.name': { ar: 'اسم Pipeline...', en: 'Pipeline name...' },
    'pipeline.input': { ar: 'المدخل:', en: 'Input:' },
    'pipeline.inputPlaceholder': { ar: 'اكتب النص الذي سيدخل أول عقدة...', en: 'Enter text for the first node...' },
    'pipeline.addAgent': { ar: '➕ أضف وكيلاً', en: '➕ Add Agent' },
    'pipeline.saved': { ar: '📁 المحفوظة', en: '📁 Saved' },
    'pipeline.noAgents': { ar: 'لا يوجد وكلاء. أنشئ وكيلاً أولاً.', en: 'No agents. Create one first.' },
    'pipeline.clear': { ar: 'مسح', en: 'Clear' },
    'pipeline.run': { ar: 'تشغيل', en: 'Run' },
    'pipeline.save': { ar: 'حفظ', en: 'Save' },
    'pipeline.emptyTitle': { ar: 'ابدأ بناء مسار الرسائل', en: 'Start building message flow' },
    'pipeline.emptyDesc': { ar: 'أضف وكلاء من القائمة ثم اربطهم بأسهم لتحديد مسار البيانات', en: 'Add agents from the list and connect them with arrows' },
    'pipeline.emptyHint1': { ar: '● أخضر = إخراج | ● وردي = إدخال', en: '● Green = Output | ● Pink = Input' },
    'pipeline.emptyHint2': { ar: '💡 يمكنك إنشاء دورات! عند التشغيل سيُسألك عن عدد التكرارات', en: '💡 You can create loops! You\'ll be asked for iteration count at runtime' },

    // ===== Edge Conditions =====
    'edge.always': { ar: 'دائماً', en: 'Always' },
    'edge.onSuccess': { ar: 'عند النجاح', en: 'On Success' },
    'edge.onError': { ar: 'عند الخطأ', en: 'On Error' },
    'edge.conditional': { ar: 'شرطي', en: 'Conditional' },
    'edge.deleteEdge': { ar: 'حذف الرابط', en: 'Delete Edge' },
    'edge.changeCondition': { ar: 'تغيير الشرط', en: 'Change Condition' },
    'edge.expression': { ar: 'التعبير الشرطي', en: 'Condition Expression' },
    'edge.expressionHint': { ar: 'مثال: يحتوي على "نجح" أو الطول > 100', en: 'Ex: contains "success" or length > 100' },
    'edge.expressionSave': { ar: 'حفظ', en: 'Save' },

    // ===== Loop =====
    'loop.detected': { ar: 'تم اكتشاف دورة (Loop)', en: 'Loop Detected' },
    'loop.desc': { ar: 'يحتوي على رابط يُسبب دورة. حدد عدد التكرارات أو ألغِ الروابط.', en: 'Contains a cyclic edge. Set iterations or remove the edges.' },
    'loop.backEdges': { ar: '🔄 الروابط المسببة للدورة:', en: '🔄 Back edges causing loop:' },
    'loop.iterations': { ar: 'عدد التكرارات (1-10):', en: 'Iterations (1-10):' },
    'loop.iterationHint': { ar: 'سيتم تنفيذ كل العقد {n} مرة', en: 'All nodes will execute {n} times' },
    'loop.cancel': { ar: 'إلغاء الدورة (حذف الروابط)', en: 'Cancel Loop (remove edges)' },
    'loop.confirm': { ar: 'تشغيل', en: 'Run' },
    'loop.badge': { ar: 'دورة', en: 'Loop' },

    // ===== Node =====
    'node.delete': { ar: 'حذف العقدة', en: 'Delete Node' },
    'node.replace': { ar: 'استبدال الوكيل', en: 'Replace Agent' },
    'node.replaceWith': { ar: 'استبدال بـ:', en: 'Replace with:' },
    'node.noOthers': { ar: 'لا يوجد وكلاء آخرين', en: 'No other agents' },
    'node.viewOutput': { ar: 'عرض المخرجات', en: 'View Output' },
    'node.noOutput': { ar: 'لم يُنفذ بعد', en: 'Not executed yet' },
    'node.viewFull': { ar: 'عرض كامل', en: 'Full View' },

    // ===== Execution Panel =====
    'exec.log': { ar: '📊 سجل التنفيذ', en: '📊 Execution Log' },
    'exec.running': { ar: 'جاري...', en: 'Running...' },
    'exec.completed': { ar: 'مكتمل ✅', en: 'Completed ✅' },
    'exec.failed': { ar: 'فشل ❌', en: 'Failed ❌' },
    'exec.ready': { ar: 'جاهز', en: 'Ready' },
    'exec.level': { ar: 'المستوى', en: 'Level' },
    'exec.expandAll': { ar: 'فتح الكل', en: 'Expand All' },
    'exec.collapseAll': { ar: 'طي الكل', en: 'Collapse All' },
    'exec.export': { ar: 'تصدير', en: 'Export' },
    'exec.copyResult': { ar: 'نسخ النتيجة', en: 'Copy Result' },
    'exec.finalOutput': { ar: '🎯 الناتج النهائي', en: '🎯 Final Output' },
    'exec.showInput': { ar: 'عرض المدخل', en: 'Show Input' },
    'exec.hideInput': { ar: 'إخفاء المدخل', en: 'Hide Input' },
    'exec.copyOutput': { ar: 'نسخ المخرج', en: 'Copy Output' },
    'exec.input': { ar: '📥 المدخل:', en: '📥 Input:' },
    'exec.output': { ar: '📤 المخرج:', en: '📤 Output:' },

    // ===== Status =====
    'status.pending': { ar: 'قيد الانتظار', en: 'Pending' },
    'status.running': { ar: 'جاري التنفيذ', en: 'Running' },
    'status.completed': { ar: 'مكتمل', en: 'Completed' },
    'status.failed': { ar: 'فشل', en: 'Failed' },
    'status.skipped': { ar: 'تم تخطيه', en: 'Skipped' },

    // ===== Toasts =====
    'toast.copied': { ar: 'تم النسخ', en: 'Copied' },
    'toast.copyFailed': { ar: 'فشل النسخ', en: 'Copy failed' },
    'toast.exported': { ar: 'تم تصدير النتائج', en: 'Results exported' },
    'toast.saved': { ar: 'تم الحفظ', en: 'Saved' },
    'toast.updated': { ar: 'تم التحديث', en: 'Updated' },
    'toast.loaded': { ar: 'تم التحميل', en: 'Loaded' },
    'toast.deleted': { ar: 'تم الحذف', en: 'Deleted' },
    'toast.cleared': { ar: 'تم مسح اللوحة', en: 'Canvas cleared' },
    'toast.addNodesFirst': { ar: 'أضف عقداً أولاً', en: 'Add nodes first' },
    'toast.addInputFirst': { ar: 'أدخل نص المدخل أولاً', en: 'Enter input text first' },
    'toast.pipelineStarted': { ar: 'بدء تنفيذ Pipeline...', en: 'Starting pipeline...' },
    'toast.pipelineSuccess': { ar: 'تم تنفيذ Pipeline بنجاح!', en: 'Pipeline executed successfully!' },
    'toast.pipelineFailed': { ar: 'فشل تنفيذ Pipeline', en: 'Pipeline execution failed' },
    'toast.loopRemoved': { ar: 'تم إزالة الروابط المسببة للدورة', en: 'Back edges removed' },
    'toast.conditionSaved': { ar: 'تم حفظ الشرط', en: 'Condition saved' },

    // ===== Settings =====
    'settings.title': { ar: 'الإعدادات', en: 'Settings' },
    'settings.apiKeys': { ar: 'مفاتيح API', en: 'API Keys' },
    'settings.addKey': { ar: 'إضافة مفتاح', en: 'Add Key' },
    'settings.keyName': { ar: 'اسم المفتاح', en: 'Key Name' },

    // ===== Navigation Sidebar =====
    'nav.dashboard': { ar: 'لوحة التحكم', en: 'Dashboard' },
    'nav.agents': { ar: 'الوكلاء', en: 'Agents' },
    'nav.chat': { ar: 'المحادثة', en: 'Chat' },
    'nav.pipeline': { ar: 'Pipeline', en: 'Pipeline' },
    'nav.compare': { ar: 'المقارنة', en: 'Compare' },
    'nav.dialogue': { ar: 'حوار آلي', en: 'Dialogue' },
    'nav.apiDocs': { ar: 'توثيق API', en: 'API Docs' },
    'nav.settings': { ar: 'الإعدادات', en: 'Settings' },
    'nav.collapse': { ar: 'طي القائمة', en: 'Collapse' },

    // ===== Pipeline: Collapsible Panels =====
    'pipeline.agentsPanel': { ar: '➕ الوكلاء', en: '➕ Agents' },
    'pipeline.savedPanel': { ar: '📁 المحفوظة', en: '📁 Saved' },
};

export const useI18nStore = create<I18nStore>()(
    persist(
        (set, get) => ({
            locale: 'ar' as Locale,
            setLocale: (locale: Locale) => set({ locale }),
            toggleLocale: () => set((s) => ({ locale: s.locale === 'ar' ? 'en' : 'ar' })),
            t: (key: string): string => {
                const locale = get().locale;
                return translations[key]?.[locale] || key;
            },
            dir: () => (get().locale === 'ar' ? 'rtl' : 'ltr'),
        }),
        { name: 'i18n-store' }
    )
);
