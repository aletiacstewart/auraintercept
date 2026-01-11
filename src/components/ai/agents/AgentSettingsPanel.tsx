import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, RotateCcw } from 'lucide-react';

interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'switch' | 'slider';
  options?: { value: string; label: string }[];
  placeholder?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: any;
}

interface AgentSettingsPanelProps {
  agentType: string;
  configFields: ConfigField[];
  currentSettings: Record<string, any>;
  onSave: (settings: Record<string, any>) => Promise<void>;
}

export function AgentSettingsPanel({
  agentType,
  configFields,
  currentSettings,
  onSave,
}: AgentSettingsPanelProps) {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize settings with current values or defaults
  useEffect(() => {
    const initial: Record<string, any> = {};
    configFields.forEach((field) => {
      initial[field.key] = currentSettings[field.key] ?? field.defaultValue ?? '';
    });
    setSettings(initial);
    setHasChanges(false);
  }, [currentSettings, configFields]);

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(settings);
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const initial: Record<string, any> = {};
    configFields.forEach((field) => {
      initial[field.key] = currentSettings[field.key] ?? field.defaultValue ?? '';
    });
    setSettings(initial);
    setHasChanges(false);
  };

  const renderField = (field: ConfigField) => {
    const value = settings[field.key];

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="bg-white text-slate-900"
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="bg-white text-slate-900"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value ?? ''}
            onChange={(e) => handleChange(field.key, parseFloat(e.target.value) || 0)}
            min={field.min}
            max={field.max}
            step={field.step || 1}
            className="bg-white text-slate-900"
          />
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={(v) => handleChange(field.key, v)}>
            <SelectTrigger className="bg-white text-slate-900">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-slate-900">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'switch':
        return (
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => handleChange(field.key, checked)}
          />
        );

      case 'slider':
        return (
          <div className="flex items-center gap-4">
            <Slider
              value={[value ?? field.min ?? 0]}
              onValueChange={([v]) => handleChange(field.key, v)}
              min={field.min}
              max={field.max}
              step={field.step || 1}
              className="flex-1"
            />
            <span className="text-sm font-medium w-12 text-right">{value ?? field.min ?? 0}</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Configuration</CardTitle>
        <CardDescription>
          Customize how this agent behaves and processes requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {configFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={field.key} className="text-sm font-medium">
                  {field.label}
                </Label>
                {field.type === 'switch' && renderField(field)}
              </div>
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
              {field.type !== 'switch' && renderField(field)}
            </div>
          ))}

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || saving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
