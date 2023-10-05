import { method, Service } from '@vtex/api'

import { longTaskById, longTaskFromEvent, longTaskFromRoute } from './middlewares/longTask'

export default new Service({
  clients: {
    options: {
      events: {
        exponentialBackoffCoefficient: 2,
        initialBackoffDelay: 100,
        retries: 2,
        concurrency: 10,
      }
    }
  },
  routes: {
    longTask: method({
      POST: [longTaskFromRoute],
    }),
    longTaskById: method({
      GET: [longTaskById],
    }),
  },
  events: {
    longTask: [longTaskFromEvent],
  }
})
