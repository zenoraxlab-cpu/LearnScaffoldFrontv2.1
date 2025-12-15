import React, { createContext, useContext, useState, useCallback } from 'react';

const TaskContext = createContext(null);

export const TASK_STAGES = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  ANALYZING: 'analyzing',
  SUMMARY: 'summary',
  CUSTOMIZING: 'customizing',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export function TaskProvider({ children }) {
  const [currentStage, setCurrentStage] = useState(TASK_STAGES.IDLE);
  const [taskData, setTaskData] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [error, setError] = useState(null);
  const [emailRegistered, setEmailRegistered] = useState(false);
  const [useLegacyMode, setUseLegacyMode] = useState(false);

  const resetTask = useCallback(() => {
    setCurrentStage(TASK_STAGES.IDLE);
    setTaskData(null);
    setTaskStatus(null);
    setError(null);
    setEmailRegistered(false);
  }, []);

  const updateTaskData = useCallback((data) => {
    setTaskData(prev => prev ? { ...prev, ...data } : data);
  }, []);

  const updateTaskStatus = useCallback((status) => {
    setTaskStatus(prev => prev ? { ...prev, ...status } : status);
  }, []);

  const value = {
    currentStage,
    setCurrentStage,
    taskData,
    setTaskData,
    updateTaskData,
    taskStatus,
    setTaskStatus,
    updateTaskStatus,
    error,
    setError,
    emailRegistered,
    setEmailRegistered,
    useLegacyMode,
    setUseLegacyMode,
    resetTask
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
}
