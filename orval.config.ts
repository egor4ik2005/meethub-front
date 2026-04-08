import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: {
      target: '../meethub/docs/openapi.yaml',
    },
    output: {
      mode: 'tags-split',
      target: 'lib/api/generated/endpoints.ts',
      schemas: 'lib/api/generated/models',
      client: 'react-query',
      httpClient: 'axios',
      mock: false,
      override: {
        mutator: {
          path: './lib/api/api.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
