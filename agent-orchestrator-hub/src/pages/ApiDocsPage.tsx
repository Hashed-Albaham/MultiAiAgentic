import { PageHeader } from '@/components/PageHeader';
import { motion } from 'framer-motion';
import { Code, Send, Bot, GitBranch, Scale, MessageCircle, Key, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface EndpointDoc {
  method: 'POST' | 'GET' | 'DELETE';
  path: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  headers: { key: string; value: string; required?: boolean }[];
  body?: string;
  response?: string;
}

const BASE_URL = 'https://your-domain.com/api/v1';

const endpoints: EndpointDoc[] = [
  {
    method: 'POST',
    path: '/chat',
    title: 'إرسال رسالة محادثة',
    description: 'أرسل رسالة لوكيل محدد واحصل على رد AI.',
    icon: Send,
    color: 'text-primary',
    headers: [
      { key: 'Authorization', value: 'Bearer wkp_xxxxx', required: true },
      { key: 'Content-Type', value: 'application/json', required: true },
    ],
    body: JSON.stringify({
      agentId: 'agent-uuid',
      message: 'ما هو الذكاء الاصطناعي؟',
      apiKey: 'sk-your-provider-api-key',
      conversationId: 'optional-conv-id',
    }, null, 2),
    response: JSON.stringify({
      success: true,
      data: {
        id: 'msg-uuid',
        role: 'assistant',
        content: 'الذكاء الاصطناعي هو...',
        tokens: { prompt: 45, completion: 120, total: 165 },
        duration: 1.2,
      },
    }, null, 2),
  },
  {
    method: 'POST',
    path: '/compare',
    title: 'مقارنة وكلاء',
    description: 'أرسل نفس الطلب لعدة وكلاء وقارن النتائج.',
    icon: Scale,
    color: 'text-accent',
    headers: [
      { key: 'Authorization', value: 'Bearer wkp_xxxxx', required: true },
      { key: 'Content-Type', value: 'application/json', required: true },
    ],
    body: JSON.stringify({
      agentIds: ['agent-1', 'agent-2', 'agent-3'],
      prompt: 'اشرح مفهوم الخوارزميات',
      apiKeys: {
        googleai: 'AIzaSy...',
        openai: 'sk-...',
      },
    }, null, 2),
    response: JSON.stringify({
      success: true,
      data: {
        results: [
          { agentId: 'agent-1', response: '...', duration: 0.8, tokens: 200 },
          { agentId: 'agent-2', response: '...', duration: 1.2, tokens: 300 },
        ],
      },
    }, null, 2),
  },
  {
    method: 'POST',
    path: '/pipeline/execute',
    title: 'تنفيذ Pipeline',
    description: 'شغّل pipeline محدد بإدخال أولي.',
    icon: GitBranch,
    color: 'text-chart-3',
    headers: [
      { key: 'Authorization', value: 'Bearer wkp_xxxxx', required: true },
      { key: 'Content-Type', value: 'application/json', required: true },
    ],
    body: JSON.stringify({
      pipelineId: 'pipeline-uuid',
      input: 'حلل هذا النص...',
      apiKeys: {
        googleai: 'AIzaSy...',
        openai: 'sk-...',
      },
    }, null, 2),
    response: JSON.stringify({
      success: true,
      data: {
        executionId: 'exec-uuid',
        status: 'completed',
        result: 'النتيجة النهائية...',
        trace: [
          { nodeId: 'n1', agentName: 'المحلل', duration: 1.5, tokens: 250 },
          { nodeId: 'n2', agentName: 'الملخص', duration: 0.9, tokens: 150 },
        ],
      },
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/agents',
    title: 'قائمة الوكلاء',
    description: 'احصل على قائمة جميع الوكلاء المسجلين.',
    icon: Bot,
    color: 'text-chart-4',
    headers: [
      { key: 'Authorization', value: 'Bearer wkp_xxxxx', required: true },
    ],
    response: JSON.stringify({
      success: true,
      data: {
        agents: [
          { id: 'agent-1', name: 'المساعد', provider: 'googleai', model: 'gemini-2.5-flash' },
        ],
      },
    }, null, 2),
  },
  {
    method: 'POST',
    path: '/dialogue',
    title: 'بدء حوار آلي',
    description: 'شغّل حوار آلي بين وكيلين مع عدد جولات محدد.',
    icon: MessageCircle,
    color: 'text-primary',
    headers: [
      { key: 'Authorization', value: 'Bearer wkp_xxxxx', required: true },
      { key: 'Content-Type', value: 'application/json', required: true },
    ],
    body: JSON.stringify({
      agent1Id: 'agent-1',
      agent2Id: 'agent-2',
      initialMessage: 'ما رأيك في مستقبل AI؟',
      maxTurns: 5,
      apiKeys: {
        googleai: 'AIzaSy...',
      },
    }, null, 2),
    response: JSON.stringify({
      success: true,
      data: {
        dialogueId: 'dlg-uuid',
        messages: [
          { agent: 'الوكيل ١', content: '...' },
          { agent: 'الوكيل ٢', content: '...' },
        ],
        totalTurns: 5,
      },
    }, null, 2),
  },
];

const copyCode = (code: string) => {
  navigator.clipboard.writeText(code);
  toast.success('تم نسخ الكود');
};

export default function ApiDocsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <PageHeader
        title="توثيق API"
        description="دليل شامل لاستخدام واجهة برمجة التطبيقات"
        actions={
          <Link to="/settings">
            <Button variant="outline" className="gap-1.5">
              <Key className="w-4 h-4" /> إنشاء توكن
            </Button>
          </Link>
        }
      />

      {/* مقدمة */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
        <h2 className="text-lg font-bold text-foreground mb-3">🚀 البدء السريع</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>استخدم API وكيل بلس للتفاعل مع الوكلاء الذكية برمجياً. كل طلب يتطلب:</p>
          <ol className="list-decimal list-inside space-y-1.5 mr-4">
            <li><strong className="text-foreground">توكن API</strong> — أنشئه من <Link to="/settings" className="text-primary underline">الإعدادات → توكنات API</Link></li>
            <li><strong className="text-foreground">مفتاح المزود</strong> — أرسل <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">apiKey</code> أو <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">apiKeys</code> في body كل طلب</li>
          </ol>
        </div>

        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">Base URL:</p>
          <div className="flex gap-2 items-center">
            <code className="flex-1 text-sm font-mono bg-background p-3 rounded-lg border border-border">{BASE_URL}</code>
            <Button size="icon" variant="outline" onClick={() => copyCode(BASE_URL)}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-chart-4/5 border border-chart-4/20">
          <p className="text-xs text-chart-4">
            ⚠️ <strong>مهم:</strong> عند استخدام API، يجب إرسال مفتاح API الخاص بمزود AI (مثل OpenAI أو Gemini) مع كل طلب.
            أما من واجهة الموقع، فتُستخدم المفاتيح المحفوظة في الإعدادات تلقائياً.
          </p>
        </div>
      </motion.div>

      {/* المصادقة */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6 mb-6">
        <h2 className="text-lg font-bold text-foreground mb-3">🔐 المصادقة</h2>
        <p className="text-sm text-muted-foreground mb-3">أضف التوكن في header كل طلب:</p>
        <CodeBlock code={`curl -X POST ${BASE_URL}/chat \\
  -H "Authorization: Bearer wkp_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "agent-uuid",
    "message": "مرحباً",
    "apiKey": "sk-your-openai-key"
  }'`} />
      </motion.div>

      {/* Endpoints */}
      <div className="space-y-6">
        {endpoints.map((ep, i) => (
          <motion.div
            key={ep.path}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center`}>
                <ep.icon className={`w-5 h-5 ${ep.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ep.method === 'POST' ? 'bg-primary/15 text-primary' :
                    ep.method === 'GET' ? 'bg-chart-3/15 text-chart-3' :
                    'bg-destructive/15 text-destructive'
                  }`}>{ep.method}</span>
                  <code className="text-sm font-mono text-foreground">{ep.path}</code>
                </div>
                <p className="text-xs text-muted-foreground">{ep.description}</p>
              </div>
            </div>

            <h4 className="text-xs font-semibold text-foreground mb-2">Headers</h4>
            <div className="mb-4 space-y-1">
              {ep.headers.map(h => (
                <div key={h.key} className="flex gap-2 text-xs font-mono">
                  <span className="text-primary">{h.key}:</span>
                  <span className="text-muted-foreground">{h.value}</span>
                  {h.required && <span className="text-destructive">*</span>}
                </div>
              ))}
            </div>

            {ep.body && (
              <>
                <h4 className="text-xs font-semibold text-foreground mb-2">Request Body</h4>
                <CodeBlock code={ep.body} className="mb-4" />
              </>
            )}

            {ep.response && (
              <>
                <h4 className="text-xs font-semibold text-foreground mb-2">Response</h4>
                <CodeBlock code={ep.response} />
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* أكواد الخطأ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6 mt-6">
        <h2 className="text-lg font-bold text-foreground mb-4">⚡ أكواد الاستجابة</h2>
        <div className="space-y-2">
          {[
            { code: 200, desc: 'نجاح — العملية تمت بنجاح', color: 'text-primary' },
            { code: 400, desc: 'طلب غير صالح — تحقق من البيانات المرسلة', color: 'text-chart-4' },
            { code: 401, desc: 'غير مصرح — التوكن غير صالح أو مفقود', color: 'text-destructive' },
            { code: 403, desc: 'محظور — التوكن لا يملك الصلاحية المطلوبة', color: 'text-destructive' },
            { code: 404, desc: 'غير موجود — الوكيل أو Pipeline غير موجود', color: 'text-chart-4' },
            { code: 429, desc: 'كثرة الطلبات — تجاوزت الحد المسموح', color: 'text-accent' },
            { code: 500, desc: 'خطأ خادم — حدث خطأ داخلي', color: 'text-destructive' },
          ].map(item => (
            <div key={item.code} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <span className={`font-mono font-bold text-sm ${item.color}`}>{item.code}</span>
              <span className="text-sm text-muted-foreground">{item.desc}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* SDK مثال */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass-card p-6 mt-6">
        <h2 className="text-lg font-bold text-foreground mb-3">📦 مثال JavaScript/TypeScript</h2>
        <CodeBlock code={`const WAKIL_API = '${BASE_URL}';
const TOKEN = 'wkp_xxxxx';

async function chat(agentId, message, apiKey) {
  const res = await fetch(\`\${WAKIL_API}/chat\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${TOKEN}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ agentId, message, apiKey }),
  });
  return res.json();
}

// الاستخدام
const result = await chat(
  'agent-uuid',
  'ما هو التعلم العميق؟',
  'sk-your-openai-key'
);
console.log(result.data.content);`} />
      </motion.div>

      {/* Python مثال */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6 mt-6 mb-8">
        <h2 className="text-lg font-bold text-foreground mb-3">🐍 مثال Python</h2>
        <CodeBlock code={`import requests

WAKIL_API = '${BASE_URL}'
TOKEN = 'wkp_xxxxx'

def chat(agent_id, message, api_key):
    res = requests.post(
        f'{WAKIL_API}/chat',
        headers={
            'Authorization': f'Bearer {TOKEN}',
            'Content-Type': 'application/json',
        },
        json={
            'agentId': agent_id,
            'message': message,
            'apiKey': api_key,
        }
    )
    return res.json()

# الاستخدام
result = chat('agent-uuid', 'ما هو التعلم العميق؟', 'sk-your-openai-key')
print(result['data']['content'])`} />
      </motion.div>
    </div>
  );
}

function CodeBlock({ code, className = '' }: { code: string; className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      <pre className="bg-background border border-border rounded-xl p-4 overflow-x-auto text-xs font-mono text-foreground/80 leading-relaxed">
        <code>{code}</code>
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
        onClick={() => { navigator.clipboard.writeText(code); toast.success('تم نسخ الكود'); }}
      >
        <Copy className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
