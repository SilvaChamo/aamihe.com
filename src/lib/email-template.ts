export function getSiteBaseUrl(baseUrl?: string): string {
  const raw =
    baseUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'https://aamihe.com';
  return raw.replace(/\/$/, '');
}

export function getEmailLogoUrl(baseUrl?: string): string {
  return `${getSiteBaseUrl(baseUrl)}/Logo-Small.png.webp`;
}

/** Template de notificação avançada (mail marketing) com logotipo AAMIHE. */
export function wrapMarketingEmailHtml(bodyHtml: string, preheader = '', baseUrl?: string): string {
  const hiddenPreheader = preheader.trim()
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader.trim()}</div>`
    : '';
  const logoUrl = getEmailLogoUrl(baseUrl);
  const siteUrl = getSiteBaseUrl(baseUrl);

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f0f0f1;font-family:Georgia,'Times New Roman',serif;">
  ${hiddenPreheader}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0f0f1;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #ccd0d4;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:#561713;padding:20px 24px;text-align:center;">
              <img src="${logoUrl}" alt="AAMIHE" width="158" style="display:block;margin:0 auto;max-width:158px;height:auto;border:0;border-radius:4px;" />
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;color:#1d2327;font-size:15px;line-height:1.65;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:#f6f7f7;border-top:1px solid #ccd0d4;color:#646970;font-size:12px;line-height:1.5;text-align:center;">
              Associação Africana de Mediação, Intervenção Humanitária e Educação<br />
              <a href="${siteUrl}" style="color:#561713;">aamihe.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** @deprecated Use wrapMarketingEmailHtml */
export const wrapEmailHtml = wrapMarketingEmailHtml;

/** E-mail normal — conteúdo simples, com pré-cabeçalho opcional. */
export function wrapPlainEmailHtml(bodyHtml: string, preheader = '', baseUrl?: string): string {
  const hiddenPreheader = preheader.trim()
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader.trim()}</div>`
    : '';
  const siteUrl = getSiteBaseUrl(baseUrl);

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f6f7f7;font-family:Georgia,'Times New Roman',serif;">
  ${hiddenPreheader}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7f7;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #ccd0d4;border-radius:8px;">
          <tr>
            <td style="padding:28px 24px;color:#1d2327;font-size:15px;line-height:1.65;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px;border-top:1px solid #f0f0f1;color:#646970;font-size:12px;text-align:center;">
              <a href="${siteUrl}" style="color:#561713;">aamihe.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
