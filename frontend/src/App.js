import React, { useState, useCallback } from 'react';
import { TaskProvider, useTask, TASK_STAGES } from '@/context/TaskContext';
import { FileUploader } from '@/components/FileUploader';
import { AnalysisSummaryModal } from '@/components/AnalysisSummaryModal';
import { ProgressTracker } from '@/components/ProgressTracker';
import { ResultDisplay } from '@/components/ResultDisplay';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/api';
import { BookOpen, Sparkles } from 'lucide-react';
import '@/App.css';

function LearnScaffoldApp() {
  const {
    currentStage,
    setCurrentStage,
    taskData,
    setTaskData,
    updateTaskData,
    taskStatus,
    setTaskStatus,
    resetTask
  } = useTask();

  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Stage 1: Handle file upload
  const handleFileUpload = useCallback(async (file) => {
    setIsUploading(true);
    setCurrentStage(TASK_STAGES.UPLOADING);

    try {
      const result = await apiService.initAnalysis(file);
      setTaskData(result);
      setCurrentStage(TASK_STAGES.SUMMARY);
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload and analyze file.',
        variant: 'destructive'
      });
      setCurrentStage(TASK_STAGES.IDLE);
    } finally {
      setIsUploading(false);
    }
  }, [setCurrentStage, setTaskData, toast]);

  // Stage 2: Handle generation start
  const handleGenerate = useCallback(async (days, hoursPerDay) => {
    if (!taskData?.task_id) return;

    setIsGenerating(true);

    try {
      const status = await apiService.startGeneration(taskData.task_id, days, hoursPerDay);
      updateTaskData({ days, hours_per_day: hoursPerDay });
      setTaskStatus(status);
      setCurrentStage(TASK_STAGES.GENERATING);
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to start study plan generation.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [taskData, setCurrentStage, setTaskStatus, updateTaskData, toast]);

  // Handle completion
  const handleComplete = useCallback((status) => {
    setTaskStatus(status);
    setCurrentStage(TASK_STAGES.COMPLETED);
    toast({
      title: 'Study Plan Ready!',
      description: 'Your personalized study plan has been generated.',
    });
  }, [setCurrentStage, setTaskStatus, toast]);

  // Handle failure
  const handleFailed = useCallback((status) => {
    setTaskStatus(status);
    setCurrentStage(TASK_STAGES.FAILED);
    toast({
      title: 'Generation Failed',
      description: status.error_message || 'An error occurred during processing.',
      variant: 'destructive'
    });
  }, [setCurrentStage, setTaskStatus, toast]);

  // Handle cancel/reset
  const handleCancel = useCallback(() => {
    resetTask();
  }, [resetTask]);

  const showSummaryModal = currentStage === TASK_STAGES.SUMMARY;
  const showProgress = currentStage === TASK_STAGES.GENERATING;
  const showResult = currentStage === TASK_STAGES.COMPLETED;
  const showUploader = currentStage === TASK_STAGES.IDLE || 
                       currentStage === TASK_STAGES.UPLOADING ||
                       currentStage === TASK_STAGES.FAILED;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">LearnScaffold</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Study Plans</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {showUploader && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                Powered by AI
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Transform Any Material Into a
                <span className="text-primary"> Structured Study Plan</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Upload your PDF, video, audio, or text file and let our AI create
                a personalized learning schedule tailored to your goals.
              </p>
            </div>

            {/* File Uploader */}
            <FileUploader
              onFileSelect={handleFileUpload}
              isUploading={isUploading}
            />

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
              <div className="text-center p-6">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Multiple Formats</h3>
                <p className="text-sm text-muted-foreground">
                  Support for PDF, MP4, MP3, and TXT files
                </p>
              </div>
              <div className="text-center p-6">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Fast Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Quick initial scan with detailed processing
                </p>
              </div>
              <div className="text-center p-6">
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Custom Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  Adjust days and hours to fit your lifestyle
                </p>
              </div>
            </div>
          </div>
        )}

        {showProgress && taskData && (
          <div className="py-8">
            <ProgressTracker
              taskId={taskData.task_id}
              onComplete={handleComplete}
              onFailed={handleFailed}
              onCancel={handleCancel}
              initialStatus={taskStatus}
            />
          </div>
        )}

        {showResult && (
          <div className="py-8">
            <ResultDisplay
              taskData={taskData}
              taskStatus={taskStatus}
              onStartOver={handleCancel}
            />
          </div>
        )}
      </main>

      {/* Analysis Summary Modal (Stage 1 -> 2 transition) */}
      <AnalysisSummaryModal
        open={showSummaryModal}
        onClose={handleCancel}
        onGenerate={handleGenerate}
        onCancel={handleCancel}
        taskData={taskData}
        isGenerating={isGenerating}
      />

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            LearnScaffold v2.1 • AI-Powered Learning Platform
          </p>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}

function App() {
  return (
    <TaskProvider>
      <LearnScaffoldApp />
    </TaskProvider>
  );
}

export default App;
