declare module 'sharp' {
  // Tipos mínimos — o pacote sharp traz tipos completos quando instalado (Vercel/produção).
  const sharp: (input?: Buffer | string, options?: object) => {
    rotate: () => unknown;
    resize: (options: object) => unknown;
    metadata: () => Promise<{ width?: number; height?: number }>;
    jpeg: (options: object) => { toBuffer: () => Promise<Buffer> };
  };
  export default sharp;
}
