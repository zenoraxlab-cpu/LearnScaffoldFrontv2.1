import React, { useCallback, useState } from 'react';
import { Upload, FileText, Film, Music, FileType, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ALLOWED_TYPES = {
  'application/pdf': { icon: FileText, label: 'PDF', ext: '.pdf' },
  'video/mp4': { icon: Film, label: 'Video', ext: '.mp4' },
  'audio/mpeg': { icon: Music, label: 'Audio', ext: '.mp3' },
  'audio/mp3': { icon: Music, label: 'Audio', ext: '.mp3' },
  'text/plain': { icon: FileType, label: 'Text', ext: '.txt' }
};

const ALLOWED_EXTENSIONS = ['.pdf', '.mp4', '.mp3', '.txt'];

export function FileUploader({ onFileSelect, isUploading = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const { toast } = useToast();

  const validateFile = useCallback((file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast({
        title: 'Unsupported file type',
        description: 'Please upload a PDF, MP4, MP3, or TXT file.',
        variant: 'destructive'
      });
      return false;
    }
    
    // Max 500MB
    if (file.size > 500 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 500MB.',
        variant: 'destructive'
      });
      return false;
    }
    
    return true;
  }, [toast]);

  const handleFile = useCallback((file) => {
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  }, [validateFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const handleUpload = useCallback(() => {
    if (selectedFile && onFileSelect) {
      onFileSelect(selectedFile);
    }
  }, [selectedFile, onFileSelect]);

  const getFileIcon = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const type = Object.entries(ALLOWED_TYPES).find(([_, v]) => v.ext === ext);
    const IconComponent = type ? type[1].icon : FileText;
    return <IconComponent className="h-8 w-8 text-primary" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!selectedFile ? (
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          data-testid="file-dropzone"
        >
          <CardContent className="flex flex-col items-center justify-center py-12 px-6">
            <label className="cursor-pointer w-full text-center">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.mp4,.mp3,.txt"
                onChange={handleInputChange}
                disabled={isUploading}
                data-testid="file-input"
              />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Upload your learning material</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop or click to browse
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {Object.entries(ALLOWED_TYPES).map(([type, { icon: Icon, label, ext }]) => (
                  <span
                    key={ext}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-muted-foreground"
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                ))}
              </div>
            </label>
          </CardContent>
        </Card>
      ) : (
        <Card className="border" data-testid="selected-file-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                {getFileIcon(selectedFile)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" data-testid="selected-filename">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {!isUploading && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                  data-testid="clear-file-btn"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1"
                data-testid="upload-btn"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Analyze File'
                )}
              </Button>
              {!isUploading && (
                <Button variant="outline" onClick={clearFile}>
                  Choose Different File
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
