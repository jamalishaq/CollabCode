/** Supported runtime languages for sandbox execution. */
export enum RuntimeLanguage {
  JavaScript = 'javascript',
  TypeScript = 'typescript',
  Python = 'python',
  Go = 'go',
  Rust = 'rust'
}

/** Execution request payload. */
export interface ExecutionRequest {
  language: RuntimeLanguage;
  code: string;
  stdin?: string;
}

/** Execution response payload. */
export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
}
