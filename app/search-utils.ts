export const productQueryFromUrl = (url: string) => new URL(url,'https://nastia.local').searchParams.get('q') ?? '';
