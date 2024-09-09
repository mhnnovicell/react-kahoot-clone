import { createClient } from '@sanity/client';

export const client = createClient({
  projectId: 'njf63xt9',
  dataset: 'production',
  useCdn: true, // set to `false` to bypass the edge cache
});

console.log(client, 'client');
