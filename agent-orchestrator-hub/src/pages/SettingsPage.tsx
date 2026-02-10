import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useApiKeyStore, generateToken, type ApiToken, type ApiKeyEntry } from '@/store/apiKeyStore';
import { AI_PROVIDERS } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye, EyeOff, Save, Trash2, Key, Shield, Download, Smartphone,
  Plus, Copy, Code, Globe, Palette, RefreshCw, Database, Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const {
    apiKeys, addApiKey, removeApiKey,
    tokens, addToken, removeToken,
  } = useApiKeyStore();

  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [newKeyValues, setNewKeyValues] = useState<Record<string, { label: string; key: string }>>({});
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenPerms, setNewTokenPerms] = useState<ApiToken['permissions']>(['chat', 'agents']);
  const [showNewToken, setShowNewToken] = useState<string | null>(null);

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> });
    });
  }

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveKey = (providerId: string) => {
    const values = newKeyValues[providerId];
    const key = values?.key?.trim();
    const label = values?.label?.trim() || `مفتاح ${AI_PROVIDERS.find((p) => p.id === providerId)?.name}`;
    if (!key) { toast.error('أدخل المفتاح أولاً'); return; }
    addApiKey(providerId, label, key);
    setNewKeyValues((prev) => ({ ...prev, [providerId]: { label: '', key: '' } }));
    toast.success(`تم حفظ مفتاح ${label}`);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') toast.success('تم تثبيت التطبيق!');
      setDeferredPrompt(null);
    }
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '•'.repeat(key.length - 8) + key.slice(-4);
  };

  const handleCreateToken = () => {
    if (!newTokenName.trim()) { toast.error('أدخل اسم التوكن'); return; }
    if (newTokenPerms.length === 0) { toast.error('اختر صلاحية واحدة على الأقل'); return; }
    const token = generateToken();
    addToken({
      id: crypto.randomUUID(),
      name: newTokenName.trim(),
      token,
      createdAt: new Date().toISOString(),
      permissions: newTokenPerms,
    });
    setShowNewToken(token);
    setNewTokenName('');
    toast.success('تم إنشاء التوكن بنجاح');
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success('تم نسخ التوكن');
  };

  const allPerms: { id: ApiToken['permissions'][number]; label: string }[] = [
    { id: 'chat', label: 'المحادثة' },
    { id: 'compare', label: 'المقارنة' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'agents', label: 'الوكلاء' },
    { id: 'dialogue', label: 'الحوار الآلي' },
  ];

  const togglePerm = (perm: ApiToken['permissions'][number]) => {
    setNewTokenPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const sectionAnim = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <PageHeader title="الإعدادات" description="إدارة المفاتيح، التوكنات، والتفضيلات" />

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="keys" className="gap-1.5"><Key className="w-3.5 h-3.5" /> مفاتيح API</TabsTrigger>
          <TabsTrigger value="tokens" className="gap-1.5"><Code className="w-3.5 h-3.5" /> توكنات API</TabsTrigger>
          <TabsTrigger value="general" className="gap-1.5"><Palette className="w-3.5 h-3.5" /> عام</TabsTrigger>
        </TabsList>

        {/* ============ مفاتيح API ============ */}
        <TabsContent value="keys" className="space-y-6">
          <motion.div {...sectionAnim} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">مفاتيح مزودي AI</h3>
                <p className="text-xs text-muted-foreground">أضف عدة مفاتيح لكل مزود — كل وكيل يختار مفتاحه</p>
              </div>
            </div>

            <div className="space-y-5">
              {AI_PROVIDERS.map((provider) => {
                const providerKeys = apiKeys.filter((k) => k.providerId === provider.id);
                const newVal = newKeyValues[provider.id] || { label: '', key: '' };

                return (
                  <div key={provider.id} className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{provider.icon}</span>
                        <Label className="font-semibold">{provider.name}</Label>
                      </div>
                      <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {providerKeys.length} مفتاح
                      </span>
                    </div>

                    {/* المفاتيح الحالية */}
                    {providerKeys.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {providerKeys.map((entry) => (
                          <div key={entry.id} className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border/50">
                            <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs font-semibold text-foreground min-w-[60px] truncate">{entry.label}</span>
                            <div className="flex-1 text-xs font-mono text-muted-foreground truncate">
                              {visibleKeys.has(entry.id) ? entry.key : maskKey(entry.key)}
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => toggleVisibility(entry.id)}>
                              {visibleKeys.has(entry.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive" onClick={() => { removeApiKey(entry.id); toast.success(`تم حذف المفتاح: ${entry.label}`); }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* إضافة مفتاح جديد */}
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={newVal.label}
                        onChange={(e) => setNewKeyValues((prev) => ({ ...prev, [provider.id]: { ...newVal, label: e.target.value } }))}
                        placeholder="تسمية (مثال: حسابي الشخصي)"
                        className="bg-background border-border text-sm w-40"
                      />
                      <Input
                        type="password"
                        value={newVal.key}
                        onChange={(e) => setNewKeyValues((prev) => ({ ...prev, [provider.id]: { ...newVal, key: e.target.value } }))}
                        placeholder={`أدخل مفتاح ${provider.name} API...`}
                        className="bg-background border-border text-sm flex-1"
                      />
                      <Button size="sm" onClick={() => handleSaveKey(provider.id)} disabled={!newVal.key?.trim()} className="gap-1.5 shrink-0">
                        <Plus className="w-3.5 h-3.5" /> أضف
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-chart-4/5 border border-chart-4/20">
              <p className="text-xs text-chart-4">
                ⚠️ المفاتيح تُحفظ محلياً في متصفحك فقط ولا تُرسل لأي خادم خارجي. يمكنك إضافة عدة مفاتيح لنفس المزود واختيار المفتاح المناسب عند إنشاء كل وكيل.
              </p>
            </div>
          </motion.div>
        </TabsContent>

        {/* ============ توكنات API ============ */}
        <TabsContent value="tokens" className="space-y-6">
          {/* إنشاء توكن جديد */}
          <motion.div {...sectionAnim} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Code className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">إنشاء توكن API</h3>
                <p className="text-xs text-muted-foreground">أنشئ توكن للوصول إلى API البرمجي — يجب إرسال apiKey المزود مع كل طلب</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm mb-1.5 block">اسم التوكن</Label>
                <Input
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  placeholder="مثال: تطبيق الموبايل..."
                  className="bg-background border-border"
                />
              </div>

              <div>
                <Label className="text-sm mb-2 block">الصلاحيات</Label>
                <div className="flex flex-wrap gap-3">
                  {allPerms.map((perm) => (
                    <label
                      key={perm.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all border ${newTokenPerms.includes(perm.id) ? 'border-primary bg-primary/10' : 'border-border bg-secondary/50'
                        }`}
                    >
                      <Checkbox
                        checked={newTokenPerms.includes(perm.id)}
                        onCheckedChange={() => togglePerm(perm.id)}
                      />
                      <span className="text-sm">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleCreateToken} className="gap-1.5">
                <Plus className="w-4 h-4" /> إنشاء توكن
              </Button>

              {showNewToken && (
                <motion.div {...sectionAnim} className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-xs text-primary font-semibold mb-2">✅ تم إنشاء التوكن — انسخه الآن فلن يظهر مجدداً</p>
                  <div className="flex gap-2 items-center">
                    <code className="flex-1 text-xs font-mono bg-background p-2 rounded-lg border border-border overflow-x-auto">
                      {showNewToken}
                    </code>
                    <Button size="icon" variant="outline" onClick={() => copyToken(showNewToken)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => setShowNewToken(null)}>
                    إخفاء
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* التوكنات الموجودة */}
          <motion.div {...sectionAnim} transition={{ delay: 0.1 }} className="glass-card p-5">
            <h3 className="font-semibold text-foreground mb-4">التوكنات النشطة ({tokens.length})</h3>
            {tokens.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">لم يتم إنشاء أي توكنات بعد</p>
            ) : (
              <div className="space-y-3">
                {tokens.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Key className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground font-mono">wkp_••••{t.token.slice(-4)}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">
                          {t.permissions.length} صلاحيات
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { removeToken(t.id); toast.success('تم حذف التوكن'); }}
                      className="shrink-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <div className="p-3 rounded-lg bg-chart-3/5 border border-chart-3/20">
            <p className="text-xs text-chart-3">
              💡 عند استخدام API خارجياً، أرسل <code className="bg-background px-1 rounded">apiKey</code> الخاص بمزود AI ضمن body الطلب.
              التوكن يُستخدم فقط للمصادقة، أما المفتاح الفعلي للمزود يُرسل مع كل طلب.
            </p>
          </div>
        </TabsContent>

        {/* ============ عام ============ */}
        <TabsContent value="general" className="space-y-6">
          {/* PWA */}
          <motion.div {...sectionAnim} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">تثبيت التطبيق</h3>
                <p className="text-xs text-muted-foreground">ثبّت وكيل بلس على جهازك كتطبيق مستقل</p>
              </div>
            </div>
            {deferredPrompt ? (
              <Button onClick={handleInstall} className="gap-2">
                <Download className="w-4 h-4" /> تثبيت الآن
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                💡 على الجوال: اضغط "مشاركة" ثم "إضافة للشاشة الرئيسية"
                <br />
                💡 على الكمبيوتر: ابحث عن أيقونة التثبيت في شريط العنوان
              </p>
            )}
          </motion.div>

          {/* معلومات النظام */}
          <motion.div {...sectionAnim} transition={{ delay: 0.1 }} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-chart-3/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-chart-3" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">معلومات النظام</h3>
                <p className="text-xs text-muted-foreground">تفاصيل المنصة والإصدار</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'الإصدار', value: '1.0.0' },
                { label: 'النوع', value: 'PWA - تطبيق ويب تقدمي' },
                { label: 'المزودون المدعومون', value: AI_PROVIDERS.map(p => p.name).join('، ') },
                { label: 'التخزين', value: 'محلي (LocalStorage)' },
                { label: 'الترخيص', value: 'MIT' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm text-foreground font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* تصدير/استيراد */}
          <motion.div {...sectionAnim} transition={{ delay: 0.2 }} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-chart-4/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-chart-4" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">النسخ الاحتياطي</h3>
                <p className="text-xs text-muted-foreground">تصدير واستيراد بيانات المنصة</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-1.5" onClick={() => {
                const data = {
                  store: JSON.parse(localStorage.getItem('wakil-plus-store') || '{}'),
                  apiKeys: JSON.parse(localStorage.getItem('wakil-plus-api-keys') || '{}'),
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `wakil-plus-backup-${Date.now()}.json`; a.click();
                URL.revokeObjectURL(url);
                toast.success('تم تصدير البيانات');
              }}>
                <Download className="w-4 h-4" /> تصدير
              </Button>
              <Button variant="outline" className="gap-1.5" onClick={() => {
                const input = document.createElement('input');
                input.type = 'file'; input.accept = '.json';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    try {
                      const data = JSON.parse(ev.target?.result as string);
                      if (data.store) localStorage.setItem('wakil-plus-store', JSON.stringify(data.store));
                      if (data.apiKeys) localStorage.setItem('wakil-plus-api-keys', JSON.stringify(data.apiKeys));
                      toast.success('تم استيراد البيانات — أعد تحميل الصفحة');
                    } catch { toast.error('ملف غير صالح'); }
                  };
                  reader.readAsText(file);
                };
                input.click();
              }}>
                <RefreshCw className="w-4 h-4" /> استيراد
              </Button>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
