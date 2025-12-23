import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, Calendar, Loader2 } from 'lucide-react';

export function AnalysisSummaryModal({
  open,
  onClose,
  onGenerate,
  taskData,
  isGenerating,
}) {
  const initialDays = useMemo(
    () => taskData?.suggested_plan?.days || 10,
    [taskData],
  );

  const initialHours = useMemo(
    () => taskData?.suggested_plan?.hours_per_day || 3,
    [taskData],
  );

  const [days, setDays] = useState(initialDays);
  const [hoursPerDay, setHoursPerDay] = useState(initialHours);

  useEffect(() => {
    setDays(initialDays);
    setHoursPerDay(initialHours);
  }, [initialDays, initialHours]);

  if (!taskData) return null;

  const totalHours = days * hoursPerDay;

  const handleGenerate = () => {
    if (!taskData.task_id) {
      alert('Task ID missing');
      return;
    }

    onGenerate(days, hoursPerDay);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Analysis Summary
          </DialogTitle>
          <DialogDescription>
            We analyzed your document. Review details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card>
            <CardContent className="pt-4 space-y-2">
              <Row label="Pages" value={taskData.pages} />
              <Row label="Language" value={<Badge>EN</Badge>} />
              <Row label="Type" value={taskData.document_type || 'Document'} />
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 p-3 bg-muted rounded">
            <Clock className="h-4 w-4" />
            Estimated processing time: <b>minutes</b>
          </div>

          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <Calendar className="h-4 w-4" />
                Suggested Plan
              </div>

              <div className="text-sm text-muted-foreground">
                {days} days × {hoursPerDay}h = {totalHours}h
              </div>

              <Slider
                min={1}
                max={60}
                step={1}
                value={[days]}
                onValueChange={([v]) => setDays(v)}
              />

              <Slider
                min={1}
                max={8}
                step={1}
                value={[hoursPerDay]}
                onValueChange={([v]) => setHoursPerDay(v)}
              />
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting…
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

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
