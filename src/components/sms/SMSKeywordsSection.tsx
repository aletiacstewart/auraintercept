import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Hash, Plus, MessageSquareText } from 'lucide-react';
import { KeywordForm, KeywordFormData } from './KeywordForm';
import { KeywordList, Keyword } from './KeywordList';

export function SMSKeywordsSection() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [deletingKeyword, setDeletingKeyword] = useState<Keyword | null>(null);

  const { data: keywords = [], isLoading } = useQuery({
    queryKey: ['sms-keywords', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('sms_keywords')
        .select('*')
        .eq('company_id', companyId)
        .order('keyword', { ascending: true });
      if (error) throw error;
      return data as Keyword[];
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: KeywordFormData) => {
      if (!companyId) throw new Error('No company ID');
      const { error } = await supabase.from('sms_keywords').insert({
        company_id: companyId,
        keyword: data.keyword,
        response_message: data.response_message,
        is_enabled: data.is_enabled,
      });
      if (error) {
        if (error.code === '23505') throw new Error('This keyword already exists');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-keywords'] });
      toast.success('Keyword created!');
      setIsFormOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: KeywordFormData) => {
      if (!data.id) throw new Error('No keyword ID');
      const { error } = await supabase
        .from('sms_keywords')
        .update({
          keyword: data.keyword,
          response_message: data.response_message,
          is_enabled: data.is_enabled,
        })
        .eq('id', data.id);
      if (error) {
        if (error.code === '23505') throw new Error('This keyword already exists');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-keywords'] });
      toast.success('Keyword updated!');
      setEditingKeyword(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sms_keywords').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-keywords'] });
      toast.success('Keyword deleted');
      setDeletingKeyword(null);
    },
    onError: () => toast.error('Failed to delete keyword'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('sms_keywords')
        .update({ is_enabled: enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-keywords'] });
    },
    onError: () => toast.error('Failed to update keyword'),
  });

  const handleFormSubmit = (data: KeywordFormData) => {
    if (editingKeyword) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (keyword: Keyword) => {
    setEditingKeyword(keyword);
  };

  const handleToggleEnabled = (keyword: Keyword, enabled: boolean) => {
    toggleMutation.mutate({ id: keyword.id, enabled });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Hash className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">SMS Keywords</CardTitle>
                <CardDescription>Auto-respond when customers text hashtag keywords</CardDescription>
              </div>
            </div>
            <Button size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50 mb-4">
            <div className="flex items-start gap-2">
              <MessageSquareText className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground">How it works:</p>
                <p>When a customer texts a hashtag like <code className="px-1 py-0.5 bg-background rounded">#menu</code>, 
                   they'll instantly receive your pre-configured response—no AI processing needed.</p>
              </div>
            </div>
          </div>
          <KeywordList
            keywords={keywords}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={setDeletingKeyword}
            onToggleEnabled={handleToggleEnabled}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      <KeywordForm
        open={isFormOpen || !!editingKeyword}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingKeyword(null);
          }
        }}
        initialData={editingKeyword ? {
          id: editingKeyword.id,
          keyword: editingKeyword.keyword,
          response_message: editingKeyword.response_message,
          is_enabled: editingKeyword.is_enabled,
        } : null}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingKeyword} onOpenChange={() => setDeletingKeyword(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Keyword</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the keyword <strong>#{deletingKeyword?.keyword}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingKeyword && deleteMutation.mutate(deletingKeyword.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
