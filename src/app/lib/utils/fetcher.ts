export const fetcher = (...args: any[]) =>
  fetch.apply(null, args as any).then((res) => res.json());
