import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Download,
  RotateCcw,
  Calendar,
  Clock,
  BookOpen,
} from 'lucide-react';
import apiService from '@/services/api';

export function ResultDisplay({ taskData, taskStatus, onStartOver }) {
  const handleDownload = async () => {
    try {
      if (!taskData?.task_id) {
        alert('Task ID not found');
        return;
      }

      await apiService.downloadPlanPdf(taskData.task_id);
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to download study plan');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto" data-testid="result-display">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <CardTitle className="text-2xl">Your Study Plan is Ready!</CardTitle>
        <CardDescription>
          We have generated a personalized study plan based on your material.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        {taskData && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Calendar className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold" data-testid="result-days">
                {taskData.days || taskData.suggested_plan?.days || '-'}
              </div>
              <div className="text-xs text-muted-foreground">Days</div>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <div
                className="text-2xl font-bold"
                data-testid="result-hours-per-day"
              >
                {taskData.hours_per_day ||
                  taskData.suggested_plan?.hours_per_day ||
                  '-'}
                h
              </div>
              <div className="text-xs text-muted-foreground">Per Day</div>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <BookOpen className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <div
                className="text-2xl font-bold"
                data-testid="result-total-hours"
              >
                {taskData.days && taskData.hours_per_day
                  ? taskData.days * taskData.hours_per_day
                  : '-'}
              </div>
              <div className="text-xs text-muted-foreground">Total Hours</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleDownload}
            className="flex-1"
            size="lg"
            data-testid="download-result-btn"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Study Plan
          </Button>

          <Button
            variant="outline"
            onClick={onStartOver}
            size="lg"
            data-testid="start-over-btn"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Create Another
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Your study plan is available for download for 24 hours.
        </p>
      </CardContent>
    </Card>
  );
}
