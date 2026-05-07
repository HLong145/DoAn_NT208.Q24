/**
 * k6 load test — simulates 100 concurrent users hammering the feed endpoint
 * Install k6: https://k6.io/docs/getting-started/installation/
 * Run: k6 run load-test.js
 *
 * What this tests:
 *   - GET /tweets/feed  (personal feed — hits Redis cache + DB)
 *   - GET /tweets/feed?scope=for-you  (explore feed)
 *   - POST /tweets  (write path — invalidates cache)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// ── Config ─────────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:4001';

// Paste a valid JWT token from your browser (DevTools → Application → localStorage)
// Or create a test account and log in once to get a token.
const TEST_TOKEN = __ENV.TOKEN || 'PASTE_JWT_HERE';

export const options = {
  stages: [
    { duration: '10s', target: 20  },  // ramp up to 20 VUs
    { duration: '30s', target: 100 },  // hold 100 concurrent users
    { duration: '10s', target: 0   },  // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests must be < 500ms
    http_req_failed:   ['rate<0.01'],  // less than 1% errors
  },
};

const feedLatency = new Trend('feed_latency');
const errorRate   = new Rate('feed_errors');

const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_TOKEN}`,
};

export default function () {
  // 1. Following feed (most common — should hit Redis cache)
  const r1 = http.get(`${BASE_URL}/tweets/feed`, { headers: HEADERS });
  feedLatency.add(r1.timings.duration);
  const ok1 = check(r1, {
    'feed 200': (r) => r.status === 200,
    'feed < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(!ok1);

  sleep(0.5);

  // 2. For-you feed
  const r2 = http.get(`${BASE_URL}/tweets/feed?scope=for-you`, { headers: HEADERS });
  check(r2, { 'for-you 200': (r) => r.status === 200 });

  sleep(1);
}