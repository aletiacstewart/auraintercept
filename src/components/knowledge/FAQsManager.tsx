import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, HelpCircle } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  is_active: boolean;
}

export function FAQsManager() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    is_active: true,
  });

  const { data: faqs, isLoading } = useQuery({
    queryKey: ['faqs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('company_id', companyId)
        .order('sort_order');
      if (error) throw error;
      return data as FAQ[];
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!companyId) throw new Error('No company ID');
      
      const payload = {
        company_id: companyId,
        question: data.question,
        answer: data.answer,
        category: data.category || null,
        is_active: data.is_active,
      };

      if (editingFaq) {
        const { error } = await supabase
          .from('faqs')
          .update(payload)
          .eq('id', editingFaq.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('faqs')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success(editingFaq ? 'FAQ updated!' : 'FAQ created!');
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Error saving FAQ:', error);
      toast.error('Failed to save FAQ');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('FAQ deleted');
    },
    onError: (error) => {
      console.error('Error deleting FAQ:', error);
      toast.error('Failed to delete FAQ');
    },
  });

  const handleOpenDialog = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category || '',
        is_active: faq.is_active,
      });
    } else {
      setEditingFaq(null);
      setFormData({
        question: '',
        answer: '',
        category: '',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFaq(null);
  };

  const handleSave = () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Please fill in both question and answer');
      return;
    }
    saveMutation.mutate(formData);
  };

  // Group FAQs by category
  const groupedFaqs = faqs?.reduce((acc, faq) => {
    const category = faq.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>) || {};

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            FAQs
          </CardTitle>
          <CardDescription>Common questions your AI can answer</CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add FAQ
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : faqs && faqs.length > 0 ? (
          <Accordion type="multiple" className="space-y-2">
            {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
              <div key={category} className="space-y-2">
                <Badge variant="outline" className="mb-2">{category}</Badge>
                {categoryFaqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <span className={!faq.is_active ? 'text-muted-foreground' : ''}>
                          {faq.question}
                        </span>
                        {!faq.is_active && (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground mb-4">{faq.answer}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenDialog(faq)}>
                          <Pencil className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(faq.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </div>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-8">
            <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No FAQs yet</p>
            <p className="text-sm text-muted-foreground">Add questions your AI should know how to answer</p>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
            <DialogDescription>
              {editingFaq ? 'Update this FAQ entry' : 'Create a new FAQ for your AI to reference'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question *</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
                placeholder="e.g., What are your hours?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Answer *</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) => setFormData((prev) => ({ ...prev, answer: e.target.value }))}
                placeholder="The answer your AI should give"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Hours, Pricing, Services"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
