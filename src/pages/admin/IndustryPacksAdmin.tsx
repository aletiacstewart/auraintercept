import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Layers,
  Plus,
  Trash2,
  Save,
  Copy,
  Download,
  Upload,
  ChevronLeft,
  Eye,
  AlertCircle,
} from 'lucide-react';
import {
  packEditableSchema,
  pickEditable,
  type PackEditable,
  type IntakeFieldInput,
  type IntakeFormSchemaInput,
  type JobTemplateInput,
} from '@/lib/industryPackSchema';
import { DynamicIntakeFields } from '@/components/forms/DynamicIntakeFields';
import type { IntakeFormSchema } from '@/lib/industryFormSchemas';

interface PackRow {
  id: string;
  industry_id: string;
  cluster: string;
  label: string;
  description: string | null;
  is_active: boolean;
  job_templates: unknown[];
  form_schemas: Record<string, unknown>;
  extra_operatives: string[];
  updated_at: string;
}

const FIELD_TYPES = ['text', 'textarea', 'number', 'select', 'date', 'checkbox'] as const;
const SHOW_IF_OPS = [
  'equals', 'not_equals', 'in', 'not_in', 'truthy', 'falsy', 'gt', 'gte', 'lt', 'lte',
] as const;
const CLUSTERS = ['trades', 'outdoor', 'repair', 'booking'] as const;

/* -------------------------------------------------------------------------- */
/* Page entry                                                                 */
/* -------------------------------------------------------------------------- */

export default function IndustryPacksAdmin() {
  const { id } = useParams<{ id?: string }>();
  return (
    <DashboardLayout>
      <PageContainer>
        {id ? <PackEditor packId={id} /> : <PackList />}
      </PageContainer>
    </DashboardLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* List view                                                                  */
/* -------------------------------------------------------------------------- */

function PackList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [cluster, setCluster] = useState<string>('all');

  const query = useQuery({
    queryKey: ['industry-packs-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('industry_template_packs')
        .select('id, industry_id, cluster, label, description, is_active, job_templates, form_schemas, extra_operatives, updated_at')
        .order('label');
      if (error) throw error;
      return (data || []) as PackRow[];
    },
  });

  const filtered = useMemo(() => {
    const rows = query.data ?? [];
    return rows.filter((p) => {
      if (cluster !== 'all' && p.cluster !== cluster) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        p.label.toLowerCase().includes(s) ||
        p.industry_id.toLowerCase().includes(s)
      );
    });
  }, [query.data, search, cluster]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Layers}
        title="Industry Pack Authoring"
        description="Edit terminology, job templates, intake forms, and prompt deltas for every vertical without writing SQL."
      />

      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3 items-end">
          <div className="space-y-1 flex-1 min-w-[220px]">
            <Label>Search</Label>
            <Input
              placeholder="Label or industry id…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Cluster</Label>
            <Select value={cluster} onValueChange={setCluster}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clusters</SelectItem>
                {CLUSTERS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : query.error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load packs.</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-4 py-2">Label</th>
                  <th className="px-4 py-2">Industry</th>
                  <th className="px-4 py-2">Cluster</th>
                  <th className="px-4 py-2">Templates</th>
                  <th className="px-4 py-2">Forms</th>
                  <th className="px-4 py-2">Extra ops</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/dashboard/admin/industry-packs/${p.id}`)}
                  >
                    <td className="px-4 py-2 font-medium">{p.label}</td>
                    <td className="px-4 py-2 text-muted-foreground">{p.industry_id}</td>
                    <td className="px-4 py-2"><Badge variant="outline">{p.cluster}</Badge></td>
                    <td className="px-4 py-2 tabular-nums">{Array.isArray(p.job_templates) ? p.job_templates.length : 0}</td>
                    <td className="px-4 py-2 tabular-nums">{Object.keys(p.form_schemas || {}).length}</td>
                    <td className="px-4 py-2 tabular-nums">{p.extra_operatives?.length ?? 0}</td>
                    <td className="px-4 py-2">
                      {p.is_active ? (
                        <Badge>active</Badge>
                      ) : (
                        <Badge variant="secondary">inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {new Date(p.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No packs match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Editor                                                                     */
/* -------------------------------------------------------------------------- */

function PackEditor({ packId }: { packId: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<PackEditable | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const packQuery = useQuery({
    queryKey: ['industry-pack-admin', packId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('industry_template_packs')
        .select('*')
        .eq('id', packId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Pack not found');
      return data as Record<string, unknown> & PackRow;
    },
  });

  useEffect(() => {
    if (packQuery.data && !draft) {
      setDraft(pickEditable(packQuery.data as Record<string, unknown>));
    }
  }, [packQuery.data, draft]);

  const updateMutation = useMutation({
    mutationFn: async (next: PackEditable) => {
      const { error } = await supabase
        .from('industry_template_packs')
        .update(next as never)
        .eq('id', packId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Pack saved');
      queryClient.invalidateQueries({ queryKey: ['industry-pack-admin', packId] });
      queryClient.invalidateQueries({ queryKey: ['industry-packs-admin'] });
      // Hot-swap into any company sessions resolving this pack.
      queryClient.invalidateQueries({ queryKey: ['industry-pack'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Save failed'),
  });

  const handleSave = () => {
    if (!draft) return;
    const result = packEditableSchema.safeParse(draft);
    if (!result.success) {
      const messages = result.error.errors.map(
        (e) => `${e.path.join('.') || 'pack'}: ${e.message}`,
      );
      setErrors(messages);
      toast.error(`Fix ${messages.length} validation issue(s) before saving`);
      return;
    }
    setErrors([]);
    updateMutation.mutate(result.data);
  };

  const handleExport = () => {
    if (!draft) return;
    const blob = new Blob([JSON.stringify(draft, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pack-${packQuery.data?.industry_id || packId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Pack JSON downloaded');
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      const result = packEditableSchema.safeParse(parsed);
      if (!result.success) {
        const messages = result.error.errors.map(
          (e) => `${e.path.join('.') || 'pack'}: ${e.message}`,
        );
        setErrors(messages);
        toast.error('Imported JSON failed validation');
        return;
      }
      setDraft(result.data);
      setImportOpen(false);
      setImportText('');
      toast.success('Imported — review then Save to commit');
    } catch {
      toast.error('Invalid JSON');
    }
  };

  if (packQuery.isLoading || !draft) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (packQuery.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load pack.{' '}
          <Button variant="link" onClick={() => navigate('/dashboard/admin/industry-packs')}>
            Back to list
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/admin/industry-packs">
              <ChevronLeft className="h-4 w-4 mr-1" /> All packs
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> {draft.label}
            </h1>
            <p className="text-xs text-muted-foreground">
              industry_id: <code>{packQuery.data.industry_id}</code>
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export JSON
          </Button>
          <Button size="sm" variant="outline" onClick={() => setImportOpen((v) => !v)}>
            <Upload className="h-4 w-4 mr-1" /> Import JSON
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-1" />
            {updateMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {importOpen && (
        <Card>
          <CardContent className="pt-6 space-y-2">
            <Label>Paste pack JSON</Label>
            <Textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="font-mono text-xs"
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setImportOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleImport}>Validate & load</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">Validation errors</div>
            <ul className="list-disc pl-5 space-y-0.5 text-xs">
              {errors.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}
              {errors.length > 8 && <li>…and {errors.length - 8} more</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="meta">
        <TabsList className="flex-wrap">
          <TabsTrigger value="meta">Meta</TabsTrigger>
          <TabsTrigger value="terminology">Terminology</TabsTrigger>
          <TabsTrigger value="templates">Job templates</TabsTrigger>
          <TabsTrigger value="forms">Form schemas</TabsTrigger>
          <TabsTrigger value="prompts">Prompt deltas</TabsTrigger>
          <TabsTrigger value="operatives">Extra operatives</TabsTrigger>
        </TabsList>

        <TabsContent value="meta">
          <MetaEditor draft={draft} setDraft={setDraft} />
        </TabsContent>
        <TabsContent value="terminology">
          <TerminologyEditor draft={draft} setDraft={setDraft} />
        </TabsContent>
        <TabsContent value="templates">
          <JobTemplatesEditor draft={draft} setDraft={setDraft} />
        </TabsContent>
        <TabsContent value="forms">
          <FormSchemasEditor draft={draft} setDraft={setDraft} />
        </TabsContent>
        <TabsContent value="prompts">
          <PromptDeltasEditor draft={draft} setDraft={setDraft} />
        </TabsContent>
        <TabsContent value="operatives">
          <ExtraOperativesEditor draft={draft} setDraft={setDraft} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section editors                                                            */
/* -------------------------------------------------------------------------- */

interface SectionProps {
  draft: PackEditable;
  setDraft: (next: PackEditable) => void;
}

function MetaEditor({ draft, setDraft }: SectionProps) {
  return (
    <Card>
      <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Label</Label>
          <Input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Cluster</Label>
          <Select
            value={draft.cluster}
            onValueChange={(v) => setDraft({ ...draft, cluster: v as PackEditable['cluster'] })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CLUSTERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Description</Label>
          <Textarea
            rows={3}
            value={draft.description ?? ''}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={draft.is_active}
            onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
          />
          <Label>Active</Label>
        </div>
      </CardContent>
    </Card>
  );
}

function TerminologyEditor({ draft, setDraft }: SectionProps) {
  const entries = Object.entries(draft.terminology);
  const addRow = () => {
    const key = `key_${entries.length + 1}`;
    setDraft({ ...draft, terminology: { ...draft.terminology, [key]: '' } });
  };
  const updateRow = (oldKey: string, newKey: string, value: string) => {
    const next = { ...draft.terminology };
    delete next[oldKey];
    next[newKey] = value;
    setDraft({ ...draft, terminology: next });
  };
  const removeRow = (key: string) => {
    const next = { ...draft.terminology };
    delete next[key];
    setDraft({ ...draft, terminology: next });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Terminology</CardTitle>
        <CardDescription>
          Per-vertical word swaps (e.g. <code>service → tune-up</code>).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex gap-2 items-center">
            <Input
              className="max-w-[200px]"
              value={key}
              onChange={(e) => updateRow(key, e.target.value, value)}
              placeholder="key"
            />
            <span className="text-muted-foreground">→</span>
            <Input
              value={value}
              onChange={(e) => updateRow(key, key, e.target.value)}
              placeholder="display word"
            />
            <Button size="icon" variant="ghost" onClick={() => removeRow(key)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" /> Add term
        </Button>
      </CardContent>
    </Card>
  );
}

function JobTemplatesEditor({ draft, setDraft }: SectionProps) {
  const formIds = Object.keys(draft.form_schemas);
  const update = (idx: number, patch: Partial<JobTemplateInput>) => {
    const next = [...draft.job_templates];
    next[idx] = { ...next[idx], ...patch };
    setDraft({ ...draft, job_templates: next });
  };
  const remove = (idx: number) => {
    setDraft({ ...draft, job_templates: draft.job_templates.filter((_, i) => i !== idx) });
  };
  const add = () => {
    setDraft({
      ...draft,
      job_templates: [
        ...draft.job_templates,
        { id: `tpl_${draft.job_templates.length + 1}`, label: 'New template', duration_minutes: 60 },
      ],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Job templates</CardTitle>
        <CardDescription>
          Service offerings that customers can book. Each may bind to a form
          schema for vertical-specific intake.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {draft.job_templates.map((tpl, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border border-border/60 rounded-md p-3">
            <div className="md:col-span-3 space-y-1">
              <Label className="text-xs">id</Label>
              <Input value={tpl.id} onChange={(e) => update(idx, { id: e.target.value })} />
            </div>
            <div className="md:col-span-4 space-y-1">
              <Label className="text-xs">label</Label>
              <Input value={tpl.label} onChange={(e) => update(idx, { label: e.target.value })} />
            </div>
            <div className="md:col-span-3 space-y-1">
              <Label className="text-xs">form_id</Label>
              <Select
                value={tpl.form_id || '__none__'}
                onValueChange={(v) => update(idx, { form_id: v === '__none__' ? null : v })}
              >
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— none —</SelectItem>
                  {formIds.map((fid) => <SelectItem key={fid} value={fid}>{fid}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1 space-y-1">
              <Label className="text-xs">min</Label>
              <Input
                type="number"
                value={tpl.duration_minutes ?? ''}
                onChange={(e) => update(idx, { duration_minutes: Number(e.target.value) || undefined })}
              />
            </div>
            <div className="md:col-span-1">
              <Button size="icon" variant="ghost" onClick={() => remove(idx)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="h-4 w-4 mr-1" /> Add template
        </Button>
      </CardContent>
    </Card>
  );
}

function FormSchemasEditor({ draft, setDraft }: SectionProps) {
  const formIds = Object.keys(draft.form_schemas);
  const [activeFormId, setActiveFormId] = useState<string>(formIds[0] ?? '');
  const [newFormId, setNewFormId] = useState('');
  const [previewValue, setPreviewValue] = useState<Record<string, unknown>>({});

  const setFormSchema = (id: string, schema: IntakeFormSchemaInput) => {
    setDraft({ ...draft, form_schemas: { ...draft.form_schemas, [id]: schema } });
  };
  const addForm = () => {
    if (!newFormId.trim() || draft.form_schemas[newFormId]) return;
    setDraft({
      ...draft,
      form_schemas: { ...draft.form_schemas, [newFormId]: { fields: [] } },
    });
    setActiveFormId(newFormId);
    setNewFormId('');
  };
  const removeForm = (id: string) => {
    const next = { ...draft.form_schemas };
    delete next[id];
    setDraft({ ...draft, form_schemas: next });
    if (activeFormId === id) setActiveFormId(Object.keys(next)[0] ?? '');
  };

  const activeSchema = draft.form_schemas[activeFormId] as IntakeFormSchemaInput | undefined;

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Active form</Label>
            <Select value={activeFormId} onValueChange={setActiveFormId}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Pick a form…" /></SelectTrigger>
              <SelectContent>
                {formIds.map((id) => <SelectItem key={id} value={id}>{id}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">New form id</Label>
            <div className="flex gap-1">
              <Input
                className="w-[180px]"
                value={newFormId}
                onChange={(e) => setNewFormId(e.target.value)}
                placeholder="hvac_service"
              />
              <Button size="sm" variant="outline" onClick={addForm}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {activeFormId && (
            <Button size="sm" variant="ghost" onClick={() => removeForm(activeFormId)} className="ml-auto">
              <Trash2 className="h-4 w-4 mr-1" /> Delete form
            </Button>
          )}
        </CardContent>
      </Card>

      {activeSchema && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 space-y-3">
            <FormFieldsEditor
              schema={activeSchema}
              onChange={(s) => setFormSchema(activeFormId, s)}
            />
          </div>
          <Card className="lg:sticky lg:top-4 self-start">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> Live preview
              </CardTitle>
              <CardDescription className="text-xs">
                Branching, validation, and steps render exactly as customers see them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DynamicIntakeFields
                schema={activeSchema as unknown as IntakeFormSchema}
                value={previewValue}
                onChange={setPreviewValue}
                title={activeFormId}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function FormFieldsEditor({
  schema,
  onChange,
}: {
  schema: IntakeFormSchemaInput;
  onChange: (next: IntakeFormSchemaInput) => void;
}) {
  const updateField = (idx: number, patch: Partial<IntakeFieldInput>) => {
    const fields = [...schema.fields];
    fields[idx] = { ...fields[idx], ...patch } as IntakeFieldInput;
    onChange({ ...schema, fields });
  };
  const removeField = (idx: number) => {
    onChange({ ...schema, fields: schema.fields.filter((_, i) => i !== idx) });
  };
  const addField = () => {
    onChange({
      ...schema,
      fields: [
        ...schema.fields,
        { name: `field_${schema.fields.length + 1}`, label: 'New field', type: 'text' },
      ],
    });
  };
  const fieldNames = schema.fields.map((f) => f.name);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fields</CardTitle>
        <CardDescription>
          Drag-free repeater. Use <code>step</code> on multiple fields to enable
          the multi-step wizard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {schema.fields.map((f, idx) => (
          <FieldRow
            key={idx}
            field={f}
            siblingNames={fieldNames}
            onChange={(patch) => updateField(idx, patch)}
            onRemove={() => removeField(idx)}
          />
        ))}
        <Button size="sm" variant="outline" onClick={addField}>
          <Plus className="h-4 w-4 mr-1" /> Add field
        </Button>
      </CardContent>
    </Card>
  );
}

function FieldRow({
  field,
  siblingNames,
  onChange,
  onRemove,
}: {
  field: IntakeFieldInput;
  siblingNames: string[];
  onChange: (patch: Partial<IntakeFieldInput>) => void;
  onRemove: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <div className="border border-border/60 rounded-md p-3 space-y-2 bg-background/40">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        <div className="md:col-span-3 space-y-1">
          <Label className="text-xs">name</Label>
          <Input value={field.name} onChange={(e) => onChange({ name: e.target.value })} />
        </div>
        <div className="md:col-span-3 space-y-1">
          <Label className="text-xs">label</Label>
          <Input value={field.label} onChange={(e) => onChange({ label: e.target.value })} />
        </div>
        <div className="md:col-span-2 space-y-1">
          <Label className="text-xs">type</Label>
          <Select value={field.type} onValueChange={(v) => onChange({ type: v as IntakeFieldInput['type'] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-1">
          <Label className="text-xs">step (optional)</Label>
          <Input value={field.step ?? ''} onChange={(e) => onChange({ step: e.target.value || undefined })} />
        </div>
        <div className="md:col-span-1 flex items-end gap-2">
          <div className="flex flex-col items-center text-xs">
            <Switch
              checked={!!field.required}
              onCheckedChange={(v) => onChange({ required: v })}
            />
            <span className="text-[10px] text-muted-foreground mt-0.5">req'd</span>
          </div>
        </div>
        <div className="md:col-span-1 flex items-end">
          <Button size="icon" variant="ghost" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {field.type === 'select' && (
        <div className="space-y-1">
          <Label className="text-xs">options (comma-separated)</Label>
          <Input
            value={(field.options || []).join(', ')}
            onChange={(e) =>
              onChange({
                options: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">placeholder</Label>
          <Input value={field.placeholder ?? ''} onChange={(e) => onChange({ placeholder: e.target.value || undefined })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">helper</Label>
          <Input value={field.helper ?? ''} onChange={(e) => onChange({ helper: e.target.value || undefined })} />
        </div>
      </div>

      <Button size="sm" variant="ghost" onClick={() => setShowAdvanced((v) => !v)}>
        {showAdvanced ? 'Hide' : 'Show'} validation & branching
      </Button>

      {showAdvanced && (
        <div className="space-y-2 border-t border-border/40 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs">pattern (regex)</Label>
              <Input
                value={field.pattern ?? ''}
                onChange={(e) => onChange({ pattern: e.target.value || undefined })}
                className="font-mono text-xs"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs">pattern message</Label>
              <Input
                value={field.patternMessage ?? ''}
                onChange={(e) => onChange({ patternMessage: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">min</Label>
              <Input
                type="number"
                value={field.min ?? ''}
                onChange={(e) => onChange({ min: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">max</Label>
              <Input
                type="number"
                value={field.max ?? ''}
                onChange={(e) => onChange({ max: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
          </div>

          <ShowIfRuleBuilder
            rules={field.show_if ?? []}
            siblingNames={siblingNames.filter((n) => n !== field.name)}
            onChange={(rules) => onChange({ show_if: rules.length ? rules : undefined })}
          />
        </div>
      )}
    </div>
  );
}

function ShowIfRuleBuilder({
  rules,
  siblingNames,
  onChange,
}: {
  rules: NonNullable<IntakeFieldInput['show_if']>;
  siblingNames: string[];
  onChange: (rules: NonNullable<IntakeFieldInput['show_if']>) => void;
}) {
  const update = (idx: number, patch: Partial<(typeof rules)[number]>) => {
    const next = [...rules];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const remove = (idx: number) => onChange(rules.filter((_, i) => i !== idx));
  const add = () =>
    onChange([...rules, { field: siblingNames[0] || '', op: 'equals', value: '' }]);

  return (
    <div className="space-y-1">
      <Label className="text-xs">show_if rules (AND)</Label>
      {rules.length === 0 && (
        <p className="text-xs text-muted-foreground">Always visible.</p>
      )}
      {rules.map((rule, idx) => {
        const needsValues = rule.op === 'in' || rule.op === 'not_in';
        const needsValue = !['truthy', 'falsy'].includes(rule.op || 'equals') && !needsValues;
        return (
          <div key={idx} className="flex flex-wrap gap-1 items-center">
            <Select value={rule.field} onValueChange={(v) => update(idx, { field: v })}>
              <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="field" /></SelectTrigger>
              <SelectContent>
                {siblingNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={rule.op || 'equals'} onValueChange={(v) => update(idx, { op: v as typeof rule.op })}>
              <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SHOW_IF_OPS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
            {needsValue && (
              <Input
                className="h-8 text-xs w-[180px]"
                placeholder="value"
                value={String(rule.value ?? '')}
                onChange={(e) => update(idx, { value: coerceValue(e.target.value) })}
              />
            )}
            {needsValues && (
              <Input
                className="h-8 text-xs w-[220px]"
                placeholder="comma-separated values"
                value={(rule.values || []).map(String).join(', ')}
                onChange={(e) =>
                  update(idx, {
                    values: e.target.value.split(',').map((v) => coerceValue(v.trim())).filter((v) => v !== ''),
                  })
                }
              />
            )}
            <Button size="icon" variant="ghost" onClick={() => remove(idx)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
      <Button size="sm" variant="outline" onClick={add} disabled={siblingNames.length === 0}>
        <Plus className="h-3.5 w-3.5 mr-1" /> Add rule
      </Button>
    </div>
  );
}

function coerceValue(raw: string): string | number | boolean {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw !== '' && !Number.isNaN(Number(raw))) return Number(raw);
  return raw;
}

function PromptDeltasEditor({ draft, setDraft }: SectionProps) {
  const entries = Object.entries(draft.agent_prompt_deltas);
  const update = (oldKey: string, newKey: string, value: string) => {
    const next = { ...draft.agent_prompt_deltas };
    delete next[oldKey];
    next[newKey] = value;
    setDraft({ ...draft, agent_prompt_deltas: next });
  };
  const remove = (key: string) =>
    setDraft({
      ...draft,
      agent_prompt_deltas: Object.fromEntries(
        Object.entries(draft.agent_prompt_deltas).filter(([k]) => k !== key),
      ),
    });
  const add = () =>
    setDraft({
      ...draft,
      agent_prompt_deltas: { ...draft.agent_prompt_deltas, new_agent: '' },
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agent prompt deltas</CardTitle>
        <CardDescription>
          Per-agent system prompt fragments injected when this pack is active.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map(([key, value]) => (
          <div key={key} className="space-y-1 border border-border/60 rounded-md p-3">
            <div className="flex gap-2 items-center">
              <Input
                className="max-w-[260px]"
                value={key}
                onChange={(e) => update(key, e.target.value, value)}
                placeholder="agent id"
              />
              <Button size="icon" variant="ghost" onClick={() => remove(key)} className="ml-auto">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              rows={4}
              value={value}
              onChange={(e) => update(key, key, e.target.value)}
              className="font-mono text-xs"
            />
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="h-4 w-4 mr-1" /> Add delta
        </Button>
      </CardContent>
    </Card>
  );
}

function ExtraOperativesEditor({ draft, setDraft }: SectionProps) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (!v || draft.extra_operatives.includes(v)) return;
    setDraft({ ...draft, extra_operatives: [...draft.extra_operatives, v] });
    setInput('');
  };
  const remove = (op: string) =>
    setDraft({ ...draft, extra_operatives: draft.extra_operatives.filter((o) => o !== op) });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Extra operatives</CardTitle>
        <CardDescription>
          Operative ids unlocked for companies on this pack (subject to tier).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {draft.extra_operatives.map((op) => (
            <Badge key={op} variant="secondary" className="gap-1">
              {op}
              <button onClick={() => remove(op)} className="ml-1">
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {draft.extra_operatives.length === 0 && (
            <p className="text-xs text-muted-foreground">None.</p>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="operative id (e.g. dispatcher_pro)"
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <Button size="sm" onClick={add}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Helper: Copy-to-clipboard utility (declared but unused for now)            */
/* -------------------------------------------------------------------------- */

export function _copyToClipboard(text: string) {
  void navigator.clipboard.writeText(text).then(() => toast.success('Copied'));
  // Re-exported in case future authoring tools want it.
  Copy.displayName = Copy.displayName;
}