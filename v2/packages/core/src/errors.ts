export class FlowixError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "FlowixError";
    this.code = code;
  }
}

export function requireCondition(condition: boolean, code: string): asserts condition {
  if (!condition) throw new FlowixError(code);
}
