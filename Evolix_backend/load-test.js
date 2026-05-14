/**
 * k6 benchmark for Evolix feed endpoints.
 *
 * Run locally against a running backend:
 *   k6 run -e TOKEN=<jwt> -e BASE_URL=http://localhost:4001 -e API_PREFIX=/api --vus 100 --duration 30s load-test.js
 *
 * Run via docker compose benchmark service:
 *   docker compose run --rm benchmark
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:4001').replace(/\/$/, '');
const API_PREFIX = (__ENV.API_PREFIX || '/api').replace(/^\/+|\/+$/g, '');
const TOKEN = __ENV.TOKEN || '';
const VUS = Number(__ENV.VUS || 100);
const DURATION = __ENV.DURATION || '30s';
const LIMIT = Number(__ENV.LIMIT || 20);
const INCLUDE_FOR_YOU = (__ENV.INCLUDE_FOR_YOU || 'true').toLowerCase() === 'true';
const FEED_BUDGET_MS = Number(__ENV.FEED_BUDGET_MS || 500);

if (!TOKEN) {
  throw new Error('Missing TOKEN. Pass -e TOKEN=<jwt>');
}

const apiBaseUrl = API_PREFIX ? `${BASE_URL}/${API_PREFIX}` : BASE_URL;

export const options = {
  scenarios: {
    benchmark: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
      gracefulStop: '10s',
    },
  },
  thresholds: {
    http_req_duration: [`p(95)<${FEED_BUDGET_MS}`],
    http_req_failed: ['rate<0.01'],
  },
};

const feedLatency = new Trend('feed_latency', true);
const feedErrors = new Rate('feed_errors');

const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

function requestFeed(scope) {
  const query = `scope=${encodeURIComponent(scope)}&limit=${LIMIT}&offset=0`;
  const response = http.get(`${apiBaseUrl}/tweets/feed?${query}`, {
    headers: HEADERS,
    tags: { endpoint: 'feed', scope },
  });

  const ok = check(response, {
    [`${scope} feed returns 200`]: (r) => r.status === 200,
    [`${scope} feed is below ${FEED_BUDGET_MS}ms`]: (r) => r.timings.duration < FEED_BUDGET_MS,
  });

  feedLatency.add(response.timings.duration, { scope });
  feedErrors.add(!ok, { scope });
}

export default function () {
  requestFeed('following');

  if (INCLUDE_FOR_YOU) {
    sleep(0.2);
    requestFeed('for-you');
  }

  sleep(1);
}
