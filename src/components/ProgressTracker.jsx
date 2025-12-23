import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import apiService from '@/services/api';

const POLL_INTERVAL = 3000;

export function ProgressTracker({
  taskId,
  onComplete,
  onFailed,
  onCancel,
  initialStatus,
}) {
  const [status, setStatus] = useState(initialStatus || null);
  const [error, setError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef(Date.now());

  const normalize = useCallback(
    (raw) => {
      if (!raw) return null;

      const backendStatus = String(raw.status || '').toLowerCase();
      const stage = raw.stage || '';

      const progress =
        typeof raw.progress === 'number'
          ? raw.progress
          : typeof raw.progress_percent === 'number'
          ? raw.progress_percent
          : 0;

      let uiStatus = 'pending';
      if (backendStatus === 'running') uiStatus = 'processing';
      if (backendStatus === 'ready') uiStatus = 'completed';
      if (backendStatus === 'error') uiStatus = 'failed';

      const stepText =
        stage === 'init'
          ? 'Starting...'
          : stage === 'extracting'
          ? 'Extracting text...'
          : stage === 'structure'
          ? 'Building structure...'
          : stage === 'done'
          ? 'Finalizing...'
          : 'Working...';

      return {
        task_id: raw.task_id || taskId,
        status: uiStatus,
        current_step: stepText,
        progress_percent: Math.max(0, Math.min(100, Number(progress) || 0)),
        eta_minutes: raw.eta_min ?? null,
        error_message: raw.detail || null,
      };
    },
    [taskId],
  );

  const fetchStatus = useCallback(async () => {
    try {
      const raw = await apiService.getTaskStatus(taskId);
      const normalized = normalize(raw);
      setStatus(normalized);

      if (normalized?.status === 'completed') {
        onComplete?.(normalized);
      }

      if (normalized?.status === 'failed') {
        setError(normalized.error_message || 'Processing failed');
        onFailed?.(normalized);
      }
    } catch (e) {
      setError('Failed to fetch status');
    }
  }, [taskId, normalize, onComplete, onFailed]);

  const isProcessing =
    status?.status === 'processing' || status?.status === 'pending';

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!isProcessing) return;

    const poll = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(poll);
  }, [isProcessing, fetchStatus]);

  useEffect(() => {
    if (!isProcessing) return;

    const t = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 1000);

    return () => clearInterval(t);
  }, [isProcessing]);

  const formatTime = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  const icon =
    status?.status === 'completed' ? (
      <CheckCircle2 className="text-green-500" />
    ) : status?.status === 'failed' ? (
      <XCircle className="text-red-500" />
    ) : (
      <Loader2 className="animate-spin text-blue-500" />
    );

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            {icon}
            <div>
              <CardTitle>Generating Study Plan</CardTitle>
              <CardDescription>
                {status?.current_step || 'Starting...'}
              </CardDescription>
            </div>
          </div>
          <Badge>{status?.status || 'pending'}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Progress value={status?.progress_percent || 0} />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Elapsed</div>
            <div>{formatTime(elapsedTime)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Remaining</div>
            <div>
              {status?.eta_minutes
                ? `~${status.eta_minutes} min`
                : 'Calculating...'}
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm border p-2 rounded">{error}</div>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" onClick={fetchStatus}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          {isProcessing && (
            <Button variant="link" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
