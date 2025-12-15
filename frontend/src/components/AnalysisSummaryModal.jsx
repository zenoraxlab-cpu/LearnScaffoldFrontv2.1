import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, Calendar, BookOpen, Settings2, Loader2 } from 'lucide-react';

export function AnalysisSummaryModal({
  open,
  onClose,
  onGenerate,
  onCancel,
  taskData,
  isGenerating = false
}) {
  const [isCustomizing, setIsCustomizing] = useState(false);
  
  // Initialize with defaults, update when taskData changes via key prop
  const initialDays = useMemo(() => 
    taskData?.suggested_plan?.recommended_days || 14, 
    [taskData?.suggested_plan?.recommended_days]
  );
  const initialHours = useMemo(() => 
    taskData?.suggested_plan?.recommended_hours_per_day || 2, 
    [taskData?.suggested_plan?.recommended_hours_per_day]
  );
  
  const [days, setDays] = useState(initialDays);
  const [hoursPerDay, setHoursPerDay] = useState(initialHours);

  // Reset values when taskData changes
  React.useEffect(() => {
    setDays(initialDays);
    setHoursPerDay(initialHours);
  }, [initialDays, initialHours]);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileTypeLabel = (type) => {
    const types = {
      '.pdf': 'PDF Document',
      '.mp4': 'Video',
      '.mp3': 'Audio',
      '.txt': 'Text File'
    };
    return types[type] || type;
  };

  const handleGenerate = () => {
    onGenerate(days, hoursPerDay);
  };

  const handleCancel = () => {
    setIsCustomizing(false);
    onCancel();
  };

  if (!taskData) return null;

  const totalHours = days * hoursPerDay;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]" data-testid="analysis-summary-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Analysis Summary
          </DialogTitle>
          <DialogDescription>
            We have analyzed your file. Review the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Info */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">File</span>
                <span className="font-medium truncate max-w-[250px]" data-testid="summary-filename">
                  {taskData.filename}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge variant="secondary">{getFileTypeLabel(taskData.file_type)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Size</span>
                <span>{formatFileSize(taskData.file_size_bytes)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {taskData.file_type === '.pdf' ? 'Pages' : 'Elements'}
                </span>
                <span data-testid="summary-elements">{taskData.pages_or_elements}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Language</span>
                <Badge>English</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Processing Estimate */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Estimated processing time:{' '}
              <strong data-testid="summary-eta">{taskData.estimated_processing_time_min} minutes</strong>
            </span>
          </div>

          {/* Study Plan Settings */}
          {isCustomizing ? (
            <Card className="border-primary">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Customize Plan
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCustomizing(false)}
                  >
                    Cancel
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="days">Study Duration</Label>
                    <span className="text-sm font-medium">{days} days</span>
                  </div>
                  <Slider
                    id="days"
                    min={1}
                    max={90}
                    step={1}
                    value={[days]}
                    onValueChange={([v]) => setDays(v)}
                    data-testid="days-slider"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="hours">Hours per Day</Label>
                    <span className="text-sm font-medium">{hoursPerDay}h</span>
                  </div>
                  <Slider
                    id="hours"
                    min={0.5}
                    max={12}
                    step={0.5}
                    value={[hoursPerDay]}
                    onValueChange={([v]) => setHoursPerDay(v)}
                    data-testid="hours-slider"
                  />
                </div>

                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded text-sm">
                  <BookOpen className="h-4 w-4" />
                  <span>Total study time: <strong>{totalHours} hours</strong></span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Suggested Plan
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {days} days × {hoursPerDay}h/day = {totalHours} hours total
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCustomizing(true)}
                    data-testid="customize-btn"
                  >
                    Customize
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating} data-testid="generate-btn">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              'Generate Study Plan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
