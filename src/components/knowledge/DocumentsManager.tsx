import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Upload, FileText, Trash2, File, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface KnowledgeDocument {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function DocumentsManager() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['knowledge-documents', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as KnowledgeDocument[];
    },
    enabled: !!companyId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: KnowledgeDocument) => {
      // Delete from storage
      await supabase.storage.from('knowledge-docs').remove([doc.file_path]);
      // Delete from database
      const { error } = await supabase.from('knowledge_documents').delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
      toast.success('Document deleted');
    },
    onError: (error) => {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, TXT, MD, or DOC files.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyId}/${Date.now()}-${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('knowledge-docs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase.from('knowledge_documents').insert({
        company_id: companyId,
        name: file.name,
        file_path: fileName,
        file_type: file.type,
        file_size: file.size,
      });

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
      // Reset the input
      e.target.value = '';
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('text') || type.includes('markdown')) return '📃';
    return '📁';
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents
          </CardTitle>
          <CardDescription>Upload documents to train your AI agent</CardDescription>
        </div>
        <div className="relative">
          <Input
            id="doc-upload"
            type="file"
            accept=".pdf,.txt,.md,.doc,.docx"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <Button
            onClick={() => document.getElementById('doc-upload')?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{getFileIcon(doc.file_type)}</div>
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(doc.file_size)} • Uploaded {format(new Date(doc.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(doc)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <File className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No documents uploaded</p>
            <p className="text-sm text-muted-foreground mb-4">
              Upload PDFs, Word docs, or text files to train your AI
            </p>
            <Button
              variant="outline"
              onClick={() => document.getElementById('doc-upload')?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Your First Document
            </Button>
          </div>
        )}

        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Supported formats:</strong> PDF, TXT, Markdown, DOC, DOCX</p>
          <p><strong className="text-foreground">Max file size:</strong> 10MB per file</p>
        </div>
      </CardContent>
    </Card>
  );
}
