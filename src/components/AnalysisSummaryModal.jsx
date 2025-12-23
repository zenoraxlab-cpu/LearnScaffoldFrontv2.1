import React, { useState, useMemo, useEffect } from 'react';
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
import {
  FileText,
  Clock,
  Calendar,
  BookOpen,
  Settings2,
  Loader2,
} from 'lucide-react';

export function AnalysisSummaryModal({
  open,
  onClose,
  onStartGeneration, // НЕ МЕНЯЕМ
  taskData,
}) {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [loading, setLoading] = useState(false);

  const initialDays = useMemo(
    () => taskData?.suggested_plan?.days || 7,
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

  const handleGenerate = async () => {
    try {
      setLoading(true);
      onClose();
      onStartGeneration({
        taskId: taskData.task_id,
        days,
        hoursPerDay,
      });
    } catch (e) {
      console.error(e);
      alert('Failed to start generation');
    } finally {
      setLoading(false);
    }
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
            We have analyzed your file. Review the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* DOCUMENT INFO */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <Row
                label="Type"
                value={<Badge>{taskData.document_type || 'Document'}</Badge>}
              />

              <Row label="Pages" value={taskData.pages} />

              <Row label="Language" value={<Badge>EN</Badge>} />

              {taskData.summary && (
                <div className="pt-2 text-sm text-muted-foreground">
                  <strong>Description</strong>
                  <div className="mt-1">{taskData.summary}</div>
                </div>
              )}

              {taskData.main_topics?.length > 0 && (
                <div className="pt-2">
                  <div className="text-sm font-medium mb-1">Main topics</div>
                  <div className="flex flex-wrap gap-2">
                    {taskData.main_topics.slice(0, 5).map((t, i) => (
                      <Badge key={i} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ETA */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Clock className="h-4 w-4" />
            <span className="text-sm">
              Estimated processing time:{' '}
              <strong>
                {taskData.estimated_processing_time_min || 'minutes'}
              </strong>
            </span>
          </div>

          {/* PLAN */}
          {isCustomizing ? (
            <Card className="border-primary">
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium flex gap-2 items-center">
                    <Settings2 className="h-4 w-4" />
                    Customize Plan
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCustomizing(false)}
                  >
                    Cancel
                  </Button>
                </div>

                <Control
                  label="Days"
                  value={days}
                  onChange={setDays}
                  min={1}
                  max={90}
                />

                <Control
                  label="Hours / day"
                  value={hoursPerDay}
                  onChange={setHoursPerDay}
                  min={1}
                  max={12}
                />

                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded">
                  <BookOpen className="h-4 w-4" />
                  Total: <strong>{totalHours} hours</strong>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-4 flex justify-between items-center">
                <div>
                  <div className="font-medium flex gap-2 items-center">
                    <Calendar className="h-4 w-4" />
                    Suggested Plan
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {days} days × {hoursPerDay}h = {totalHours}h
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCustomizing(true)}
                >
                  Customize
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
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
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Control({ label, value, onChange, min, max, step = 1 }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label>{label}</Label>
        <span className="font-medium">{value}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}
