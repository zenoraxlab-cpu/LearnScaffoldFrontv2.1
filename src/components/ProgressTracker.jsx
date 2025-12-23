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
import { usePolling } from '@/hooks/usePolling';
import apiService from '@/services/api';

const POLL_INTERVAL = 3000; // 3s — чтобы видеть движение

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

  // --- helpers: normalize backend -> frontend contract ---
  const normalize = useCallback(
    (raw) => {
      if (!raw) return null;

      // backend returns:
      // { task_id, status: "running"|"ready"|"error", stage: "...", progress: 10..100, eta_min? }
      const backendStatus = (raw.status || '').toString().toLowerCase();
      const stage = raw.stage || raw.current_step || '';

      // progress can be "progress" or "progress_percent"
      const progress =
        typeof raw.progress === 'number'
          ? raw.progress
          : typeof raw.progress_percent === 'number'
          ? raw.progress_percent
          : 0;

      // status mapping for UI
      // UI expects: pending/processing/completed/failed
      let uiStatus = 'pending';
      if (backendStatus === 'running') uiStatus = 'processing';
      if (backendStatus === 'ready') uiStatus = 'completed';
      if (backendStatus === 'error' || backendStatus === 'failed')
        uiStatus = 'failed';

      // stage -> human text
      const stepText =
        raw.message ||
        (stage === 'init'
          ? 'Starting...'
          : stage === 'extracting'
          ? 'Extracting text...'
          : stage === 'structure'
          ? 'Building structure...'
          : stage === 'done'
          ? 'Finalizing...'
          : stage || 'Working...');

      return {
        task_id: raw.task_id || raw.taskId || raw.id || taskId,
        status: uiStatus,
        current_step: stepText,
        progress_percent: Math.max(0, Math.min(100, Number(progress) || 0)),
        eta_minutes: raw.eta_min ?? raw.eta_minutes ?? null,
        error_message: raw.error_message || raw.detail || null,
        _raw: raw,
      };
    },
    [taskId],
  );

  const fetchStatus = useCallback(async () => {
    try {
      const raw = await apiService.getTaskStatus(taskId);
      const newStatus = normalize(raw);
      setStatus(newStatus);

      if (newStatus?.status === 'completed') {
        onComplete?.(newStatus);
      } else if (newStatus?.status === 'failed') {
        setError(newStatus?.error_message || 'Processing failed');
        onFailed?.(newStatus);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
      // Не роняем UI; просто покажем ошибку если уже в процессе
      setError((prev) => prev || 'Status check failed');
    }
  }, [taskId, normalize, onComplete, onFailed]);

  const isProcessing =
    status?.status === 'processing' || status?.status === 'pending';

  usePolling(fetchStatus, POLL_INTERVAL, isProcessing);

  // start polling immediately once mounted
  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  // Track elapsed time
  useEffect(() => {
    if (!isProcessing) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [isProcessing]);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (status?.status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'processing':
        return 'bg-blue-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusIcon = () => {
    switch (status?.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto" data-testid="progress-tracker">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg">Generating Study Plan</CardTitle>
              <CardDescription>
                {status?.current_step || 'Starting...'}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`${getStatusColor()} text-white border-none`}
          >
            {status?.status || 'pending'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span data-testid="progress-percent">
              {status?.progress_percent ?? 0}%
            </span>
          </div>
          <Progress
            value={status?.progress_percent ?? 0}
            className="h-3"
            data-testid="progress-bar"
          />
        </div>

        {/* Time Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Elapsed Time</div>
            <div className="text-lg font-semibold" data-testid="elapsed-time">
              {formatTime(elapsedTime)}
            </div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">
              Estimated Remaining
            </div>
            <div className="text-lg font-semibold" data-testid="eta">
              {status?.eta_minutes
                ? `~${status.eta_minutes} min`
                : 'Calculating...'}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            data-testid="error-message"
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={fetchStatus}
            disabled={!isProcessing}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {isProcessing && (
            <Button
              variant="link"
              onClick={onCancel}
              className="text-muted-foreground"
            >
              Cancel and start over
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
