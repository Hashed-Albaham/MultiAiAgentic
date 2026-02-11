import { useState, useRef } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useApiKeyStore, generateToken, type ApiToken } from '@/store/apiKeyStore';
import { useI18nStore } from '@/store/i18nStore';
import { AI_PROVIDERS } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye, EyeOff, Save, Trash2, Key, Shield, Download, Smartphone, Upload,
  Plus, Copy, Code, Globe, Palette, RefreshCw, Database, Tag, Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { t } = useI18nStore();
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
  const importRef = useRef<HTMLInputElement>(null);

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
    const label = values?.label?.trim() || `${AI_PROVIDERS.find((p) => p.id === providerId)?.name} Key`;
    if (!key) { toast.error(t('form.nameRequired')); return; }
    addApiKey(providerId, label, key);
    setNewKeyValues((prev) => ({ ...prev, [providerId]: { label: '', key: '' } }));
    toast.success(t('toast.saved'));
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') toast.success('✅');
      setDeferredPrompt(null);
    }
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '•'.repeat(key.length - 8) + key.slice(-4);
  };

  const handleCreateToken = () => {
    if (!newTokenName.trim()) { toast.error(t('settings.tokenName')); return; }
    if (newTokenPerms.length === 0) { toast.error(t('settings.permissions')); return; }
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
    toast.success(t('toast.saved'));
  };

  const copyToken = (tkn: string) => {
    navigator.clipboard.writeText(tkn);
    toast.success(t('toast.copied'));
  };

  const allPerms: { id: ApiToken['permissions'][number]; labelKey: string }[] = [
    { id: 'chat', labelKey: 'nav.chat' },
    { id: 'compare', labelKey: 'nav.compare' },
    { id: 'pipeline', labelKey: 'nav.pipeline' },
    { id: 'agents', labelKey: 'nav.agents' },
    { id: 'dialogue', labelKey: 'nav.dialogue' },
  ];

  const togglePerm = (perm: ApiToken['permissions'][number]) => {
    setNewTokenPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  // ===== تصدير كل localStorage =====
  const handleExportAll = () => {
    const allData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) allData[key] = localStorage.getItem(key) || '';
    }
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `agent-plus-backup-${now}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('settings.exportSuccess'));
  };

  // ===== استيراد localStorage =====
  const handleImportAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (typeof data !== 'object' || data === null) throw new Error('invalid');
        // استبدال كل localStorage
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, value as string);
        });
        toast.success(t('settings.importSuccess'));
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        toast.error(t('settings.importError'));
      }
    };
    reader.readAsText(file);
    // إعادة تعيين قيمة input حتى يمكن رفع نفس الملف مرة أخرى
    e.target.value = '';
  };

  const sectionAnim = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl pt-14 md:pt-6 lg:pt-8">
      <PageHeader title={t('settings.title')} description={t('settings.subtitle')} />

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="keys" className="gap-1.5"><Key className="w-3.5 h-3.5" /> {t('settings.apiKeys')}</TabsTrigger>
          <TabsTrigger value="tokens" className="gap-1.5"><Code className="w-3.5 h-3.5" /> {t('settings.tokens')}</TabsTrigger>
          <TabsTrigger value="general" className="gap-1.5"><Palette className="w-3.5 h-3.5" /> {t('settings.general')}</TabsTrigger>
        </TabsList>

        {/* ============ API Keys ============ */}
        <TabsContent value="keys" className="space-y-6">
          <motion.div {...sectionAnim} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t('settings.apiKeys')}</h3>
                <p className="text-xs text-muted-foreground">{t('settings.subtitle')}</p>
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
                        {providerKeys.length} {t('settings.apiKeys').split(' ')[0]}
                      </span>
                    </div>

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
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive" onClick={() => { removeApiKey(entry.id); toast.success(t('toast.deleted')); }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={newVal.label}
                        onChange={(e) => setNewKeyValues((prev) => ({ ...prev, [provider.id]: { ...newVal, label: e.target.value } }))}
                        placeholder={t('settings.keyName')}
                        className="bg-background border-border text-sm w-40"
                      />
                      <Input
                        type="password"
                        value={newVal.key}
                        onChange={(e) => setNewKeyValues((prev) => ({ ...prev, [provider.id]: { ...newVal, key: e.target.value } }))}
                        placeholder={`${provider.name} API Key...`}
                        className="bg-background border-border text-sm flex-1"
                      />
                      <Button size="sm" onClick={() => handleSaveKey(provider.id)} disabled={!newVal.key?.trim()} className="gap-1.5 shrink-0">
                        <Plus className="w-3.5 h-3.5" /> {t('settings.addKey')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </TabsContent>

        {/* ============ API Tokens ============ */}
        <TabsContent value="tokens" className="space-y-6">
          <motion.div {...sectionAnim} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Code className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t('settings.createToken')}</h3>
                <p className="text-xs text-muted-foreground">{t('settings.tokens')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm mb-1.5 block">{t('settings.tokenName')}</Label>
                <Input
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  placeholder={t('settings.tokenName')}
                  className="bg-background border-border"
                />
              </div>

              <div>
                <Label className="text-sm mb-2 block">{t('settings.permissions')}</Label>
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
                      <span className="text-sm">{t(perm.labelKey)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleCreateToken} className="gap-1.5">
                <Plus className="w-4 h-4" /> {t('settings.createToken')}
              </Button>

              {showNewToken && (
                <motion.div {...sectionAnim} className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-xs text-primary font-semibold mb-2">✅ {t('toast.saved')}</p>
                  <div className="flex gap-2 items-center">
                    <code className="flex-1 text-xs font-mono bg-background p-2 rounded-lg border border-border overflow-x-auto">
                      {showNewToken}
                    </code>
                    <Button size="icon" variant="outline" onClick={() => copyToken(showNewToken)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => setShowNewToken(null)}>
                    {t('app.close')}
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Active Tokens */}
          <motion.div {...sectionAnim} transition={{ delay: 0.1 }} className="glass-card p-5">
            <h3 className="font-semibold text-foreground mb-4">{t('settings.tokens')} ({tokens.length})</h3>
            {tokens.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t('app.noResults')}</p>
            ) : (
              <div className="space-y-3">
                {tokens.map((tkn) => (
                  <div key={tkn.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Key className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{tkn.name}</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground font-mono">wkp_••••{tkn.token.slice(-4)}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">
                          {tkn.permissions.length} {t('settings.permissions')}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { removeToken(tkn.id); toast.success(t('toast.deleted')); }}
                      className="shrink-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* ============ General ============ */}
        <TabsContent value="general" className="space-y-6">
          {/* PWA Install */}
          <motion.div {...sectionAnim} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">PWA</h3>
                <p className="text-xs text-muted-foreground">{t('app.brandName')}</p>
              </div>
            </div>
            {deferredPrompt ? (
              <Button onClick={handleInstall} className="gap-2">
                <Download className="w-4 h-4" /> Install
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                💡 Mobile: Share → Add to Home Screen<br />
                💡 Desktop: Install icon in address bar
              </p>
            )}
          </motion.div>

          {/* System Info */}
          <motion.div {...sectionAnim} transition={{ delay: 0.1 }} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-chart-3/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-chart-3" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t('settings.general')}</h3>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Version', value: '1.0.0' },
                { label: 'Type', value: 'PWA' },
                { label: 'Providers', value: AI_PROVIDERS.map(p => p.name).join(', ') },
                { label: 'Storage', value: 'LocalStorage' },
                { label: 'License', value: 'MIT' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm text-foreground font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ===== Export / Import — كل localStorage ===== */}
          <motion.div {...sectionAnim} transition={{ delay: 0.2 }} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-chart-4/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-chart-4" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t('settings.exportImport')}</h3>
                <p className="text-xs text-muted-foreground">{t('settings.exportDesc')}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Export */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{t('settings.exportAll')}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('settings.exportDesc')}</p>
                  </div>
                  <Button onClick={handleExportAll} className="gap-1.5">
                    <Download className="w-4 h-4" /> {t('exec.export')}
                  </Button>
                </div>
              </div>

              {/* Import */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{t('settings.importAll')}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('settings.importDesc')}</p>
                  </div>
                  <div>
                    <input
                      ref={importRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImportAll}
                    />
                    <Button variant="outline" onClick={() => importRef.current?.click()} className="gap-1.5">
                      <Upload className="w-4 h-4" /> {t('settings.importAll')}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-chart-4/5 border border-chart-4/20">
                <p className="text-xs text-chart-4">
                  ⚠️ {t('apiDocs.important')} {t('settings.importDesc')}
                </p>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
