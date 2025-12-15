import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, Mic, X, Loader2, Sparkles, FileAudio, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

interface VoiceCloningCardProps {
  hasElevenLabs: boolean;
}

interface AudioFile {
  file: File;
  name: string;
  duration?: number;
}

export function VoiceCloningCard({ hasElevenLabs }: VoiceCloningCardProps) {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [voiceName, setVoiceName] = useState('');
  const [voiceDescription, setVoiceDescription] = useState('');
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const cloneMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      if (!voiceName.trim()) throw new Error('Voice name is required');
      if (audioFiles.length === 0) throw new Error('At least one audio sample is required');

      const formData = new FormData();
      formData.append('company_id', companyId);
      formData.append('voice_name', voiceName.trim());
      formData.append('voice_description', voiceDescription.trim());

      audioFiles.forEach((audio, index) => {
        formData.append(`audio_${index}`, audio.file, audio.name);
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-clone-voice`,
        {
          method: 'POST',
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to clone voice');
      }
      return data;
    },
    onSuccess: (data) => {
      toast.success('Voice cloned successfully!', {
        description: `Your new voice "${voiceName}" is now available.`,
      });
      // Reset form
      setVoiceName('');
      setVoiceDescription('');
      setAudioFiles([]);
      // Refresh integrations to show new voice
      queryClient.invalidateQueries({ queryKey: ['integrations-elevenlabs'] });
    },
    onError: (error) => {
      console.error('Clone error:', error);
      toast.error('Failed to clone voice', {
        description: error.message,
      });
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const validFiles: AudioFile[] = [];
    const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/x-m4a', 'audio/webm'];

    for (const file of Array.from(files)) {
      // Check file type
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|webm)$/i)) {
        toast.error(`Invalid file type: ${file.name}`, {
          description: 'Please upload MP3, WAV, M4A, or WebM files.',
        });
        continue;
      }

      // Check file size (max 10MB per file)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File too large: ${file.name}`, {
          description: 'Maximum file size is 10MB.',
        });
        continue;
      }

      // Check if already added
      if (audioFiles.some(af => af.name === file.name)) {
        toast.error(`File already added: ${file.name}`);
        continue;
      }

      validFiles.push({ file, name: file.name });
    }

    if (validFiles.length > 0) {
      setAudioFiles(prev => [...prev, ...validFiles].slice(0, 25)); // Max 25 samples
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setAudioFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!hasElevenLabs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Voice Cloning
          </CardTitle>
          <CardDescription>
            Create a custom AI voice from audio samples
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Configure ElevenLabs API key in Integrations to enable voice cloning.</span>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <a href="/dashboard/integrations">
                  Go to Integrations <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Voice Cloning
        </CardTitle>
        <CardDescription>
          Create a custom AI voice by uploading audio samples of the voice you want to clone
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Name */}
        <div className="space-y-2">
          <Label htmlFor="voiceName">Voice Name *</Label>
          <Input
            id="voiceName"
            placeholder="e.g., Company Voice, Sarah's Voice"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
          />
        </div>

        {/* Voice Description */}
        <div className="space-y-2">
          <Label htmlFor="voiceDescription">Description (Optional)</Label>
          <Textarea
            id="voiceDescription"
            placeholder="Describe the voice characteristics..."
            value={voiceDescription}
            onChange={(e) => setVoiceDescription(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>

        {/* File Upload Area */}
        <div className="space-y-2">
          <Label>Audio Samples *</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,.webm,audio/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              Drop audio files here or click to upload
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              MP3, WAV, M4A, or WebM (max 10MB each, up to 25 files)
            </p>
          </div>
        </div>

        {/* Uploaded Files List */}
        {audioFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Uploaded Samples</Label>
              <Badge variant="secondary">{audioFiles.length} file(s)</Badge>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {audioFiles.map((audio, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                >
                  <FileAudio className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm truncate flex-1">{audio.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(audio.file.size)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <Alert>
          <Mic className="h-4 w-4" />
          <AlertDescription>
            <strong>Tips for best results:</strong>
            <ul className="mt-1 text-xs space-y-1 list-disc list-inside">
              <li>Use high-quality recordings with minimal background noise</li>
              <li>Include 1-5 minutes of total audio for best quality</li>
              <li>Use consistent speaking style across samples</li>
              <li>Avoid music or multiple speakers in samples</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Clone Button */}
        <Button
          className="w-full"
          onClick={() => cloneMutation.mutate()}
          disabled={cloneMutation.isPending || !voiceName.trim() || audioFiles.length === 0}
        >
          {cloneMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Cloning Voice...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Clone Voice
            </>
          )}
        </Button>

        {audioFiles.length > 0 && (
          <p className="text-xs text-center text-muted-foreground">
            This will create a new voice and set it as your AI agent's voice
          </p>
        )}
      </CardContent>
    </Card>
  );
}
