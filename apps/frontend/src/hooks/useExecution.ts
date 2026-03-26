import type { ExecutionRequest, ExecutionResult } from '@collabcode/shared-types';
import { useState } from 'react';

import { runCode } from '../services/executionService';

interface UseExecutionState {
  isRunning: boolean;
  run: (payload: ExecutionRequest) => Promise<ExecutionResult | null>;
}

export function useExecution(): UseExecutionState {
  const [isRunning, setIsRunning] = useState(false);

  const run = async (payload: ExecutionRequest): Promise<ExecutionResult | null> => {
    setIsRunning(true);
    try {
      const response = await runCode(payload);
      return response.data;
    } finally {
      setIsRunning(false);
    }
  };

  return { isRunning, run };
}
