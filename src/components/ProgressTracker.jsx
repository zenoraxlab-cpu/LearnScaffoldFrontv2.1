import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import apiService from '@/services/api';

export function ProgressTracker({ taskId }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!taskId) return;

    const timer = setInterval(async () => {
      try {
        const data = await apiService.getTaskStatus(taskId);
        setStatus(data);
      } catch (e) {
        console.error('Status fetch failed', e);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [taskId]);

  if (!status) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="p-6">Starting…</CardContent>
      </Card>
    );
  }

  const progress = status.progress ?? 0;
  const stageLabel = status.stage || 'working';
  const isDone = status.status === 'ready';

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">Generating Study Plan</h3>
          <p className="text-sm text-muted-foreground">{stageLabel}</p>
        </div>
        <Badge variant={isDone ? 'default' : 'secondary'}>
          {status.status}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {isDone && (
          <div className="text-green-600 font-medium">
            ✔ Study plan generated
          </div>
        )}

        <button
          type="button"
          onClick={() => apiService.getTaskStatus(taskId).then(setStatus)}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <RefreshCw size={14} /> refresh
        </button>
      </CardContent>
    </Card>
  );
}
