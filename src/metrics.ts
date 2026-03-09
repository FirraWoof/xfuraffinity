import { Counter, Histogram, Registry } from 'prom-client';

export const registry = new Registry();

export const requestsTotal = new Counter({
  name: 'requests_total',
  help: 'Total submission requests',
  labelNames: ['requester', 'country'] as const,
  registers: [registry],
});

export const cacheHitsTotal = new Counter({
  name: 'cache_hits_total',
  help: 'Submissions served from cache',
  registers: [registry],
});

export const fafetchesTotal = new Counter({
  name: 'furaffinity_fetches_total',
  help: 'Fetches made to FurAffinity (cache misses)',
  registers: [registry],
});

export const submissionResultsTotal = new Counter({
  name: 'submission_results_total',
  help: 'Submission result types',
  labelNames: ['result'] as const,
  registers: [registry],
});

export const errorsTotal = new Counter({
  name: 'errors_total',
  help: 'Unexpected errors in submission handler',
  registers: [registry],
});

export const submissionDuration = new Histogram({
  name: 'submission_duration_seconds',
  help: 'Submission handling latency by cache status',
  labelNames: ['cached'] as const,
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

export const fafetchDuration = new Histogram({
  name: 'furaffinity_fetch_duration_seconds',
  help: 'Latency of individual requests to FurAffinity',
  labelNames: ['request'] as const,
  buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
  registers: [registry],
});
