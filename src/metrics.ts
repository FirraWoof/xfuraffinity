import newrelic from 'newrelic';

export type SubmissionEvent = {
  submissionId: number;
  url: string;
  requester: string;
  service: string;
  userAgent: string;
  country: string;
  cached: boolean;
  submissionResult: string;
  durationMs: number;
  // FA server error details, present when submissionResult === 'serverError'
  upstreamStatus?: number;
  upstreamStatusText?: string;
  upstreamCfRay?: string;
  upstreamBody?: string;
};

export function recordSubmissionEvent(event: SubmissionEvent) {
  newrelic.recordCustomEvent('SubmissionRequest', event);
}

export function noticeError(err: unknown) {
  if (err instanceof Error) {
    newrelic.noticeError(err);
  } else {
    newrelic.noticeError(new Error(String(err)));
  }
}
