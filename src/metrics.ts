import newrelic from 'newrelic';

export type SubmissionEvent = {
  submissionId: number;
  requester: string;
  country: string;
  cached: boolean;
  submissionResult: string;
  durationMs: number;
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
