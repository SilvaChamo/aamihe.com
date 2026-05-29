/** Vercel Blob store do projeto está em modo private — public falha no put/get. */
export const BLOB_ACCESS = (process.env.BLOB_ACCESS === 'public' ? 'public' : 'private') as
  | 'public'
  | 'private';
