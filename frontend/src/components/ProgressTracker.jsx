import React, { useState, useEffect, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, CheckCircle2, XCircle, Mail, Download, RefreshCw } from 'lucide-react';
import { usePolling } from '@/hooks/usePolling';
import apiService from '@/services/api';
import { EmailNotificationModal } from './EmailNotificationModal';

const POLL_INTERVAL = 20000; // 20 seconds
const EMAIL_PROMPT_THRESHOLD = 5 * 60 * 1000; // 5 minutes in ms

export function ProgressTracker({
  taskId,
  onComplete,
  onFailed,
  onCancel,
  initialStatus
}) {
  const [status, setStatus] = useState(initialStatus || null);
  const [error, setError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRegistered, setEmailRegistered] = useState(false);
  const [startTime] = useState(Date.now());

  // Poll for status updates
  const fetchStatus = useCallback(async () => {
    try {
      const newStatus = await apiService.getTaskStatus(taskId);
      setStatus(newStatus);

      if (newStatus.status === 'completed') {
        onComplete?.(newStatus);
      } else if (newStatus.status === 'failed') {
        setError(newStatus.error_message || 'Processing failed');
        onFailed?.(newStatus);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  }, [taskId, onComplete, onFailed]);

  const isProcessing = status?.status === 'processing' || status?.status === 'pending';

  usePolling(fetchStatus, POLL_INTERVAL, isProcessing);

  // Track elapsed time
  useEffect(() => {
    if (!isProcessing) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);

      // Show email modal after 5 minutes if not already shown
      if (elapsed > EMAIL_PROMPT_THRESHOLD && !emailRegistered && !showEmailModal) {
        setShowEmailModal(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isProcessing, startTime, emailRegistered, showEmailModal]);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleEmailSubmit = async (email) => {
    try {
      await apiService.registerEmailNotification(taskId, email);
      setEmailRegistered(true);
      setShowEmailModal(false);
    } catch (err) {
      throw err;
    }
  };

  const handleDownload = () => {
    const url = apiService.getDownloadUrl(taskId);
    window.open(url, '_blank');
  };

  const getStatusColor = () => {
    switch (status?.status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'processing': return 'bg-blue-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusIcon = () => {
    switch (status?.status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing': return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      default: return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <>
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
            <Badge variant="outline" className={`${getStatusColor()} text-white border-none`}>
              {status?.status || 'pending'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span data-testid="progress-percent">{status?.progress_percent || 0}%</span>
            </div>
            <Progress value={status?.progress_percent || 0} className="h-3" data-testid="progress-bar" />
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
              <div className="text-sm text-muted-foreground">Estimated Remaining</div>
              <div className="text-lg font-semibold" data-testid="eta">
                {status?.eta_minutes ? `~${status.eta_minutes} min` : 'Calculating...'}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" data-testid="error-message">
              {error}
            </div>
          )}

          {/* Email Registered Notice */}
          {emailRegistered && status?.status !== 'completed' && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm" data-testid="email-registered-notice">
              <Mail className="h-4 w-4" />
              <span>We'll email you when your study plan is ready. You can safely close this page.</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {status?.status === 'completed' ? (
              <Button onClick={handleDownload} className="flex-1" data-testid="download-btn">
                <Download className="h-4 w-4 mr-2" />
                Download Study Plan
              </Button>
            ) : (
              <>
                {!emailRegistered && isProcessing && (
                  <Button
                    variant="outline"
                    onClick={() => setShowEmailModal(true)}
                    className="flex-1"
                    data-testid="email-notify-btn"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Notify Me by Email
                  </Button>
                )}
                <Button variant="ghost" onClick={fetchStatus} disabled={!isProcessing}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Cancel Option */}
          {isProcessing && !emailRegistered && (
            <div className="text-center">
              <Button variant="link" onClick={onCancel} className="text-muted-foreground">
                Cancel and start over
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <EmailNotificationModal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSubmit={handleEmailSubmit}
        estimatedTime={status?.eta_minutes}
      />
    </>
  );
}
