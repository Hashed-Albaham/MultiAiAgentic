import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAgentStore } from '@/store/agentStore';
import { useApiKeyStore } from '@/store/apiKeyStore';
import { AI_PROVIDERS, AI_MODELS, type Agent } from '@/types';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Key, AlertTriangle } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'اسم الوكيل مطلوب'),
  description: z.string().optional(),
  systemPrompt: z.string().min(1, 'System Prompt مطلوب'),
  modelProvider: z.string().min(1, 'اختر المزود'),
  modelId: z.string().min(1, 'اختر النموذج'),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(100).max(128000),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editAgent?: Agent;
}

export function AgentFormDialog({ open, onOpenChange, editAgent }: Props) {
  const { addAgent, updateAgent } = useAgentStore();
  const { apiKeys, getKeysByProvider } = useApiKeyStore();
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      systemPrompt: '',
      modelProvider: 'googleai',
      modelId: 'gemini-2.5-flash',
      temperature: 0.7,
      maxTokens: 4096,
    },
  });

  const watchProvider = form.watch('modelProvider');
  const models = AI_MODELS[watchProvider] || [];
  const providerKeys = getKeysByProvider(watchProvider);

  useEffect(() => {
    if (editAgent) {
      form.reset({
        name: editAgent.name,
        description: editAgent.description || '',
        systemPrompt: editAgent.systemPrompt,
        modelProvider: editAgent.modelProvider,
        modelId: editAgent.modelId,
        temperature: editAgent.modelConfig?.temperature ?? 0.7,
        maxTokens: editAgent.modelConfig?.maxTokens ?? 4096,
      });
      setSelectedKeyId(editAgent.apiKeyId || '');
    } else {
      form.reset({
        name: '',
        description: '',
        systemPrompt: '',
        modelProvider: 'googleai',
        modelId: 'gemini-2.5-flash',
        temperature: 0.7,
        maxTokens: 4096,
      });
      setSelectedKeyId('');
    }
  }, [editAgent, open]);

  // عند تغيير المزود، اختر أول مفتاح متوفر أو اترك فارغاً
  useEffect(() => {
    const keys = getKeysByProvider(watchProvider);
    if (keys.length > 0 && !keys.find((k) => k.id === selectedKeyId)) {
      setSelectedKeyId(keys[0].id);
    } else if (keys.length === 0) {
      setSelectedKeyId('');
    }
  }, [watchProvider, apiKeys]);

  const onSubmit = (data: FormData) => {
    const payload = {
      name: data.name,
      description: data.description,
      systemPrompt: data.systemPrompt,
      modelProvider: data.modelProvider,
      modelId: data.modelId,
      apiKeyId: selectedKeyId || undefined,
      modelConfig: { temperature: data.temperature, maxTokens: data.maxTokens },
    };
    if (editAgent) {
      updateAgent(editAgent.id, payload);
      toast.success('تم تحديث الوكيل');
    } else {
      addAgent(payload);
      toast.success('تم إنشاء الوكيل');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>{editAgent ? 'تعديل الوكيل' : 'وكيل جديد'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>الاسم</Label>
            <Input {...form.register('name')} placeholder="اسم الوكيل" className="bg-secondary border-border mt-1" />
            {form.formState.errors.name && <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>}
          </div>

          <div>
            <Label>الوصف</Label>
            <Input {...form.register('description')} placeholder="وصف مختصر" className="bg-secondary border-border mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>المزود</Label>
              <Select value={watchProvider} onValueChange={(v) => { form.setValue('modelProvider', v); form.setValue('modelId', AI_MODELS[v]?.[0]?.id || ''); }}>
                <SelectTrigger className="bg-secondary border-border mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.icon} {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>النموذج</Label>
              <Select value={form.watch('modelId')} onValueChange={(v) => form.setValue('modelId', v)}>
                <SelectTrigger className="bg-secondary border-border mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* اختيار مفتاح API */}
          <div>
            <Label className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" /> مفتاح API
            </Label>
            {providerKeys.length > 0 ? (
              <Select value={selectedKeyId} onValueChange={setSelectedKeyId}>
                <SelectTrigger className="bg-secondary border-border mt-1">
                  <SelectValue placeholder="اختر مفتاحاً..." />
                </SelectTrigger>
                <SelectContent>
                  {providerKeys.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.label} ({k.key.slice(0, 6)}...{k.key.slice(-4)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="mt-1 p-2.5 rounded-lg bg-chart-4/10 border border-chart-4/20 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-chart-4 shrink-0" />
                <p className="text-xs text-chart-4">
                  لا توجد مفاتيح لـ {AI_PROVIDERS.find((p) => p.id === watchProvider)?.name}. اذهب للإعدادات لإضافة مفتاح.
                </p>
              </div>
            )}
          </div>

          <div>
            <Label>System Prompt</Label>
            <Textarea {...form.register('systemPrompt')} placeholder="تعليمات النظام للوكيل..." rows={4} className="bg-secondary border-border mt-1 resize-none" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Temperature</Label>
              <span className="text-xs text-muted-foreground font-mono">{form.watch('temperature')}</span>
            </div>
            <Slider
              value={[form.watch('temperature')]}
              onValueChange={([v]) => form.setValue('temperature', v)}
              min={0} max={2} step={0.1}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit">{editAgent ? 'تحديث' : 'إنشاء'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
