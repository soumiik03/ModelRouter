# ModelRouter

## Environment Variables

The following environment variables are required for the Upstash Redis integration:

- `UPSTASH_REDIS_REST_URL`: The REST URL for your Upstash Redis database.
- `UPSTASH_REDIS_REST_TOKEN`: The REST token for your Upstash Redis database.

If these variables are not provided, the router will automatically fall back to an in-memory Map cache.
