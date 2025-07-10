import { createClient } from '@sanity/client';

export const client = createClient({
  projectId: 'njf63xt9',
  dataset: 'production',
  useCdn: false, // set to `false` to bypass the edge cache
  token:
    'skzZ2VpeXZRenzw0lMv7xpdDvK3eWqR5r2YXjSvbRsqR8pKqoN4EUzFeG77JUemgM08fCZrP2wcCFJSPXf2T5j09rDR2mA8NgI7GSzzO56X41drSSmOxyMK69DMau4f87qEerRageaEYcqDwdPi5InE2t37YY8UdXQMqC0rCU9u5tqiEg5nm', // or leave blank for unauthenticated usage
});

console.log(client, 'client');
