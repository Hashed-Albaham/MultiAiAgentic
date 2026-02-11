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
    // ===== General =====
    'app.title': { ar: 'مركز تنسيق الوكلاء', en: 'Agent Orchestrator Hub' },
    'app.brandName': { ar: 'وكيل بلس', en: 'Agent Plus' },
    'app.language': { ar: 'English', en: 'العربية' },
    'app.cancel': { ar: 'إلغاء', en: 'Cancel' },
    'app.save': { ar: 'حفظ', en: 'Save' },
    'app.delete': { ar: 'حذف', en: 'Delete' },
    'app.edit': { ar: 'تعديل', en: 'Edit' },
    'app.create': { ar: 'إنشاء', en: 'Create' },
    'app.update': { ar: 'تحديث', en: 'Update' },
    'app.close': { ar: 'إغلاق', en: 'Close' },
    'app.search': { ar: 'بحث...', en: 'Search...' },
    'app.openMenu': { ar: 'فتح القائمة', en: 'Open Menu' },
    'app.print': { ar: 'طباعة', en: 'Print' },

    // ===== Dashboard =====
    'dashboard.title': { ar: 'لوحة التحكم', en: 'Dashboard' },
    'dashboard.subtitle': { ar: 'مركز تحكم شامل لإدارة وتنسيق الوكلاء الذكية', en: 'Comprehensive control center for managing AI agents' },
    'dashboard.totalAgents': { ar: 'إجمالي الوكلاء', en: 'Total Agents' },
    'dashboard.totalPipelines': { ar: 'خطوط الأنابيب', en: 'Pipelines' },
    'dashboard.providers': { ar: 'المزودون', en: 'Providers' },
    'dashboard.quickActions': { ar: '⚡ إجراءات سريعة', en: '⚡ Quick Actions' },
    'dashboard.newAgent': { ar: 'وكيل جديد', en: 'New Agent' },
    'dashboard.newPipeline': { ar: 'Pipeline جديد', en: 'New Pipeline' },
    'dashboard.startChat': { ar: 'بدء محادثة', en: 'Start Chat' },
    'dashboard.compareModels': { ar: 'مقارنة النماذج', en: 'Compare Models' },

    // ===== Agents =====
    'agents.title': { ar: 'إدارة الوكلاء', en: 'Agent Management' },
    'agents.subtitle': { ar: 'إنشاء وإدارة الوكلاء الذكية', en: 'Create and manage AI agents' },
    'agents.new': { ar: 'وكيل جديد', en: 'New Agent' },
    'agents.searchPlaceholder': { ar: 'بحث عن وكيل...', en: 'Search agents...' },
    'agents.empty': { ar: 'لا توجد وكلاء', en: 'No agents found' },
    'agents.emptyHint': { ar: 'ابدأ بإنشاء وكيل جديد', en: 'Start by creating a new agent' },
    'agents.chat': { ar: 'محادثة', en: 'Chat' },
    'agents.deleteConfirm': { ar: 'تم حذف الوكيل بنجاح', en: 'Agent deleted successfully' },

    // ===== Agent Form =====
    'form.editAgent': { ar: 'تعديل الوكيل', en: 'Edit Agent' },
    'form.newAgent': { ar: 'وكيل جديد', en: 'New Agent' },
    'form.name': { ar: 'الاسم', en: 'Name' },
    'form.namePlaceholder': { ar: 'اسم الوكيل', en: 'Agent name' },
    'form.nameRequired': { ar: 'اسم الوكيل مطلوب', en: 'Agent name is required' },
    'form.description': { ar: 'الوصف', en: 'Description' },
    'form.descPlaceholder': { ar: 'وصف مختصر', en: 'Short description' },
    'form.provider': { ar: 'المزود', en: 'Provider' },
    'form.providerRequired': { ar: 'اختر المزود', en: 'Select a provider' },
    'form.model': { ar: 'النموذج', en: 'Model' },
    'form.modelRequired': { ar: 'اختر النموذج', en: 'Select a model' },
    'form.apiKey': { ar: 'مفتاح API', en: 'API Key' },
    'form.selectKey': { ar: 'اختر مفتاحاً...', en: 'Select a key...' },
    'form.noKeys': { ar: 'لا توجد مفاتيح. اذهب للإعدادات لإضافة مفتاح.', en: 'No keys found. Go to Settings to add one.' },
    'form.systemPrompt': { ar: 'System Prompt', en: 'System Prompt' },
    'form.promptRequired': { ar: 'System Prompt مطلوب', en: 'System Prompt is required' },
    'form.promptPlaceholder': { ar: 'تعليمات النظام للوكيل...', en: 'System instructions for the agent...' },
    'form.agentUpdated': { ar: 'تم تحديث الوكيل', en: 'Agent updated' },
    'form.agentCreated': { ar: 'تم إنشاء الوكيل', en: 'Agent created' },

    // ===== Chat =====
    'chat.title': { ar: 'المحادثة', en: 'Chat' },
    'chat.subtitle': { ar: 'تحدث مع الوكلاء الذكية', en: 'Talk to AI agents' },
    'chat.selectAgent': { ar: 'اختر وكيلاً', en: 'Select an agent' },
    'chat.placeholder': { ar: 'اكتب رسالتك...', en: 'Type your message...' },
    'chat.send': { ar: 'إرسال', en: 'Send' },
    'chat.thinking': { ar: 'يفكر...', en: 'Thinking...' },
    'chat.clearChat': { ar: 'مسح المحادثة', en: 'Clear Chat' },
    'chat.noAgent': { ar: 'اختر وكيلاً للبدء', en: 'Select an agent to start' },
    'chat.you': { ar: 'أنت', en: 'You' },
    'chat.startWith': { ar: 'ابدأ محادثة مع', en: 'Start a conversation with' },
    'chat.typeBelow': { ar: 'اكتب رسالتك في الأسفل', en: 'Type your message below' },
    'chat.noKey': { ar: 'بدون مفتاح', en: 'No key' },
    'chat.noKeyWarning': { ar: 'هذا الوكيل لا يملك مفتاح API — اذهب للإعدادات وأضف مفتاحاً ثم عدّل الوكيل', en: 'This agent has no API key — go to Settings, add a key, then edit the agent' },
    'chat.connectionError': { ar: 'فشل الاتصال بـ AI', en: 'Failed to connect to AI' },

    // ===== Compare =====
    'compare.title': { ar: 'مقارنة الوكلاء', en: 'Compare Agents' },
    'compare.subtitle': { ar: 'قارن ردود عدة وكلاء على نفس السؤال', en: 'Compare responses from multiple agents to the same prompt' },
    'compare.prompt': { ar: 'السؤال:', en: 'Prompt:' },
    'compare.promptPlaceholder': { ar: 'اكتب سؤالاً لمقارنة الردود...', en: 'Enter a prompt to compare responses...' },
    'compare.selectAgents': { ar: 'اختر الوكلاء', en: 'Select Agents' },
    'compare.run': { ar: 'مقارنة', en: 'Compare' },
    'compare.noAgents': { ar: 'اختر وكيلين على الأقل', en: 'Select at least 2 agents' },
    'compare.result': { ar: 'النتيجة', en: 'Result' },
    'compare.duration': { ar: 'المدة', en: 'Duration' },
    'compare.tokens': { ar: 'التوكنات', en: 'Tokens' },
    'compare.selectRange': { ar: 'اختر الوكلاء (2-5)', en: 'Select agents (2-5)' },
    'compare.comparing': { ar: 'جاري المقارنة...', en: 'Comparing...' },
    'compare.writeQuestion': { ar: 'اكتب سؤالك هنا...', en: 'Type your prompt here...' },
    'compare.writeFirst': { ar: 'اكتب السؤال أولاً', en: 'Enter the prompt first' },

    // ===== Dialogue =====
    'dialogue.title': { ar: 'حوار آلي', en: 'Auto Dialogue' },
    'dialogue.subtitle': { ar: 'شغّل حوار آلي بين وكيلين', en: 'Run an automated dialogue between two agents' },
    'dialogue.agent1': { ar: 'الوكيل الأول', en: 'First Agent' },
    'dialogue.agent2': { ar: 'الوكيل الثاني', en: 'Second Agent' },
    'dialogue.rounds': { ar: 'عدد الجولات', en: 'Rounds' },
    'dialogue.initialMsg': { ar: 'الرسالة الأولى', en: 'Initial Message' },
    'dialogue.start': { ar: 'بدء الحوار', en: 'Start Dialogue' },
    'dialogue.stop': { ar: 'إيقاف', en: 'Stop' },
    'dialogue.round': { ar: 'الجولة', en: 'Round' },
    'dialogue.initialPlaceholder': { ar: 'اكتب الرسالة الأولية التي ستبدأ الحوار...', en: 'Enter the initial message to start the dialogue...' },
    'dialogue.system': { ar: 'النظام', en: 'System' },
    'dialogue.roundOf': { ar: 'من', en: 'of' },
    'dialogue.resume': { ar: 'استئناف', en: 'Resume' },
    'dialogue.pause': { ar: 'إيقاف مؤقت', en: 'Pause' },
    'dialogue.done': { ar: 'انتهى الحوار!', en: 'Dialogue complete!' },
    'dialogue.exported': { ar: 'تم تصدير الحوار', en: 'Dialogue exported' },
    'dialogue.selectTwo': { ar: 'اختر وكيلين', en: 'Select two agents' },
    'dialogue.selectDifferent': { ar: 'اختر وكيلين مختلفين', en: 'Select two different agents' },
    'dialogue.enterInitial': { ar: 'أدخل رسالة أولية', en: 'Enter an initial message' },
    'dialogue.emptyTitle': { ar: 'الحوار الآلي بين وكيلين', en: 'Automated dialogue between two agents' },
    'dialogue.emptyDesc': { ar: 'اختر وكيلين، اكتب رسالة أولية، وشاهد الحوار يتدفق', en: 'Select two agents, write an initial message, and watch the dialogue unfold' },
    'dialogue.initialMsgLabel': { ar: 'الرسالة الأولية:', en: 'Initial message:' },

    // ===== Settings =====
    'settings.title': { ar: 'الإعدادات', en: 'Settings' },
    'settings.subtitle': { ar: 'إدارة مفاتيح API والتفضيلات', en: 'Manage API keys and preferences' },
    'settings.apiKeys': { ar: 'مفاتيح API', en: 'API Keys' },
    'settings.addKey': { ar: 'إضافة مفتاح', en: 'Add Key' },
    'settings.keyName': { ar: 'اسم المفتاح', en: 'Key Name' },
    'settings.keyValue': { ar: 'المفتاح', en: 'Key Value' },
    'settings.provider': { ar: 'المزود', en: 'Provider' },
    'settings.tokens': { ar: 'توكنات API', en: 'API Tokens' },
    'settings.createToken': { ar: 'إنشاء توكن', en: 'Create Token' },
    'settings.tokenName': { ar: 'اسم التوكن', en: 'Token Name' },
    'settings.permissions': { ar: 'الصلاحيات', en: 'Permissions' },
    'settings.general': { ar: 'عام', en: 'General' },
    'settings.language': { ar: 'اللغة', en: 'Language' },
    'settings.theme': { ar: 'المظهر', en: 'Theme' },
    'settings.exportImport': { ar: '📦 تصدير / استيراد', en: '📦 Export / Import' },
    'settings.exportAll': { ar: 'تصدير كل البيانات', en: 'Export All Data' },
    'settings.exportDesc': { ar: 'تصدير جميع الإعدادات والوكلاء والمفاتيح و Pipelines كملف JSON', en: 'Export all settings, agents, keys, and pipelines as a JSON file' },
    'settings.importAll': { ar: 'استيراد البيانات', en: 'Import Data' },
    'settings.importDesc': { ar: 'استيراد البيانات من ملف JSON تم تصديره مسبقاً', en: 'Import data from a previously exported JSON file' },
    'settings.importSuccess': { ar: 'تم استيراد البيانات بنجاح! أعد تحميل الصفحة.', en: 'Data imported successfully! Reload the page.' },
    'settings.importError': { ar: 'فشل استيراد البيانات — تأكد من صحة الملف', en: 'Import failed — verify the file is valid' },
    'settings.exportSuccess': { ar: 'تم تصدير البيانات بنجاح', en: 'Data exported successfully' },
    'settings.dangerZone': { ar: '⚠️ منطقة الخطر', en: '⚠️ Danger Zone' },
    'settings.clearAll': { ar: 'مسح كل البيانات', en: 'Clear All Data' },
    'settings.clearConfirm': { ar: 'هل أنت متأكد؟ لا يمكن التراجع!', en: 'Are you sure? This cannot be undone!' },

    // ===== API Docs =====
    'apiDocs.title': { ar: 'توثيق API', en: 'API Documentation' },
    'apiDocs.subtitle': { ar: 'دليل شامل لاستخدام واجهة برمجة التطبيقات', en: 'Comprehensive guide to using the API' },
    'apiDocs.createToken': { ar: 'إنشاء توكن', en: 'Create Token' },
    'apiDocs.quickStart': { ar: '🚀 البدء السريع', en: '🚀 Quick Start' },
    'apiDocs.quickStartDesc': { ar: 'استخدم API وكيل بلس للتفاعل مع الوكلاء الذكية برمجياً. كل طلب يتطلب:', en: 'Use the Agent Plus API to interact with AI agents programmatically. Each request requires:' },
    'apiDocs.tokenReq': { ar: 'توكن API — أنشئه من الإعدادات → توكنات API', en: 'API Token — create it from Settings → API Tokens' },
    'apiDocs.providerKey': { ar: 'مفتاح المزود — أرسل apiKey أو apiKeys في body كل طلب', en: 'Provider key — send apiKey or apiKeys in each request body' },
    'apiDocs.auth': { ar: '🔐 المصادقة', en: '🔐 Authentication' },
    'apiDocs.authDesc': { ar: 'أضف التوكن في header كل طلب:', en: 'Add the token in each request header:' },
    'apiDocs.important': { ar: 'مهم:', en: 'Important:' },
    'apiDocs.importantDesc': { ar: 'عند استخدام API، يجب إرسال مفتاح API الخاص بمزود AI مع كل طلب. أما من واجهة الموقع، فتُستخدم المفاتيح المحفوظة تلقائياً.', en: 'When using the API, you must send the AI provider API key with each request. From the website interface, saved keys are used automatically.' },
    'apiDocs.endpoints': { ar: 'نقاط النهاية', en: 'Endpoints' },
    'apiDocs.responseCodes': { ar: '⚡ أكواد الاستجابة', en: '⚡ Response Codes' },
    'apiDocs.copied': { ar: 'تم نسخ الكود', en: 'Code copied' },

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
    'pipeline.emptyDesc': { ar: 'أضف وكلاء من القائمة ثم اربطهم بأسهم', en: 'Add agents from the list and connect them with arrows' },
    'pipeline.emptyHint1': { ar: '● أخضر = إخراج | ● وردي = إدخال', en: '● Green = Output | ● Pink = Input' },
    'pipeline.emptyHint2': { ar: '💡 يمكنك إنشاء دورات!', en: '💡 You can create loops!' },
    'pipeline.agentsPanel': { ar: '➕ الوكلاء', en: '➕ Agents' },
    'pipeline.savedPanel': { ar: '📁 المحفوظة', en: '📁 Saved' },

    // ===== Edge =====
    'edge.always': { ar: 'دائماً', en: 'Always' },
    'edge.onSuccess': { ar: 'عند النجاح', en: 'On Success' },
    'edge.onError': { ar: 'عند الخطأ', en: 'On Error' },
    'edge.conditional': { ar: 'شرطي', en: 'Conditional' },
    'edge.deleteEdge': { ar: 'حذف الرابط', en: 'Delete Edge' },
    'edge.changeCondition': { ar: 'تغيير الشرط', en: 'Change Condition' },
    'edge.expression': { ar: 'التعبير الشرطي', en: 'Condition Expression' },
    'edge.expressionHint': { ar: 'مثال: يحتوي على "نجح"', en: 'Ex: contains "success"' },
    'edge.expressionSave': { ar: 'حفظ', en: 'Save' },

    // ===== Loop =====
    'loop.detected': { ar: 'تم اكتشاف دورة (Loop)', en: 'Loop Detected' },
    'loop.desc': { ar: 'يحتوي على رابط يُسبب دورة. حدد عدد التكرارات أو ألغِ الروابط.', en: 'Contains a cyclic edge. Set iterations or remove.' },
    'loop.backEdges': { ar: '🔄 الروابط المسببة:', en: '🔄 Back edges:' },
    'loop.iterations': { ar: 'عدد التكرارات (1-10):', en: 'Iterations (1-10):' },
    'loop.iterationHint': { ar: 'سيتم تنفيذ كل العقد {n} مرة', en: 'All nodes execute {n} times' },
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
    'node.duration': { ar: 'المدة', en: 'Duration' },
    'node.tokens': { ar: 'التوكنات', en: 'Tokens' },
    'node.output': { ar: 'المخرج', en: 'Output' },
    'node.noWindow': { ar: 'لم نتمكن من فتح نافذة', en: 'Could not open window' },

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

    // ===== Navigation =====
    'nav.dashboard': { ar: 'لوحة التحكم', en: 'Dashboard' },
    'nav.agents': { ar: 'الوكلاء', en: 'Agents' },
    'nav.chat': { ar: 'المحادثة', en: 'Chat' },
    'nav.pipeline': { ar: 'Pipeline', en: 'Pipeline' },
    'nav.compare': { ar: 'المقارنة', en: 'Compare' },
    'nav.dialogue': { ar: 'حوار آلي', en: 'Dialogue' },
    'nav.apiDocs': { ar: 'توثيق API', en: 'API Docs' },
    'nav.settings': { ar: 'الإعدادات', en: 'Settings' },
    'nav.collapse': { ar: 'طي القائمة', en: 'Collapse' },
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
