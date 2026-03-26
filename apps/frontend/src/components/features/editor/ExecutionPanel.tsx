import type { ExecutionResult } from '@collabcode/shared-types';

interface ExecutionPanelProps {
  result: ExecutionResult | null;
  isRunning: boolean;
}

export function ExecutionPanel({ result, isRunning }: ExecutionPanelProps) {
  return (
    <section className="panel execution-panel">
      <h3>Execution</h3>
      {isRunning ? <p>Running code…</p> : null}
      {!isRunning && !result ? <p>Run code to see output.</p> : null}
      {result ? (
        <>
          <p><strong>Exit code:</strong> {result.exitCode}</p>
          <p><strong>Duration:</strong> {result.executionTimeMs}ms</p>
          <pre>{result.stdout || '(no stdout)'}</pre>
          {result.stderr ? <pre className="stderr">{result.stderr}</pre> : null}
        </>
      ) : null}
    </section>
  );
}
