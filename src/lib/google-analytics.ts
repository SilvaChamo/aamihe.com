import { createSign } from 'crypto';
import { getPublicSiteOrigin } from '@/lib/site-url';
import { getGoogleClientId, getGoogleClientSecret } from '@/lib/google-oauth';
import type { SiteSettingsPayload } from '@/lib/supabase-settings';

export const GA_ANALYTICS_READONLY_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
export const GA_OAUTH_STATE_COOKIE = 'aamihe_ga_analytics_state';

export type GoogleAnalyticsConnection = {
  refreshToken?: string;
  propertyId?: string;
  connectedEmail?: string;
  connectedAt?: string;
};

export type Ga4BreakdownRow = {
  label: string;
  activeUsers: number;
};

export type Ga4RealtimeSnapshot = {
  configured: boolean;
  measurementId: string;
  propertyId: string | null;
  activeUsers: number;
  pages: Ga4BreakdownRow[];
  countries: Ga4BreakdownRow[];
  devices: Ga4BreakdownRow[];
  sources: Ga4BreakdownRow[];
  updatedAt: string;
  authMode: 'service-account' | 'oauth' | null;
  error?: string;
};

type ServiceAccountConfig = {
  clientEmail: string;
  privateKey: string;
};

function getMeasurementId(settings?: SiteSettingsPayload | null): string {
  return (
    settings?.googleAnalyticsId?.trim() ||
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ||
    'G-JJJZM7P441'
  );
}

function base64Url(input: Buffer | string): string {
  const buffer = typeof input === 'string' ? Buffer.from(input) : input;
  return buffer.toString('base64url');
}

function readServiceAccountConfig(): ServiceAccountConfig | null {
  const rawJson = process.env.GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as { client_email?: string; private_key?: string };
      if (parsed.client_email && parsed.private_key) {
        return {
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key.replace(/\\n/g, '\n'),
        };
      }
    } catch {
      return null;
    }
  }

  const clientEmail = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  if (clientEmail && privateKey) {
    return { clientEmail, privateKey };
  }

  return null;
}

function getPropertyId(settings?: SiteSettingsPayload | null): string | null {
  const fromEnv = process.env.GA4_PROPERTY_ID?.trim();
  if (fromEnv) return fromEnv.replace(/^properties\//, '');

  const fromSettings = settings?.googleAnalytics?.propertyId?.trim();
  if (fromSettings) return fromSettings.replace(/^properties\//, '');

  return null;
}

export function getGoogleAnalyticsRedirectUri(request?: Request): string {
  return `${getPublicSiteOrigin(request)}/api/admin/analytics/callback`;
}

export function buildGoogleAnalyticsAuthUrl(request: Request, state: string): string {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('Google OAuth não configurado (GOOGLE_CLIENT_ID).');
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', getGoogleAnalyticsRedirectUri(request));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GA_ANALYTICS_READONLY_SCOPE);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('state', state);
  return url.toString();
}

async function fetchGoogleToken(body: URLSearchParams): Promise<{
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  return (await res.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };
}

export async function exchangeGoogleAnalyticsCode(
  code: string,
  request: Request,
): Promise<{ accessToken: string; refreshToken?: string; error?: string }> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  if (!clientId || !clientSecret) {
    return { accessToken: '', error: 'Google OAuth não configurado no servidor.' };
  }

  const data = await fetchGoogleToken(
    new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleAnalyticsRedirectUri(request),
      grant_type: 'authorization_code',
    }),
  );

  if (!data.access_token) {
    return {
      accessToken: '',
      error: data.error_description || data.error || 'Falha ao obter token Google Analytics.',
    };
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}

export async function refreshGoogleAnalyticsAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string; error?: string }> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  if (!clientId || !clientSecret) {
    return { accessToken: '', error: 'Google OAuth não configurado no servidor.' };
  }

  const data = await fetchGoogleToken(
    new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  );

  if (!data.access_token) {
    return {
      accessToken: '',
      error: data.error_description || data.error || 'Falha ao renovar token Google Analytics.',
    };
  }

  return { accessToken: data.access_token };
}

async function getServiceAccountAccessToken(config: ServiceAccountConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      iss: config.clientEmail,
      scope: GA_ANALYTICS_READONLY_SCOPE,
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = base64Url(signer.sign(config.privateKey));
  const assertion = `${unsigned}.${signature}`;

  const data = await fetchGoogleToken(
    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  );

  if (!data.access_token) {
    throw new Error(data.error_description || data.error || 'Falha ao autenticar service account.');
  }

  return data.access_token;
}

async function getAnalyticsAccessToken(
  settings?: SiteSettingsPayload | null,
): Promise<{ accessToken: string; authMode: 'service-account' | 'oauth' }> {
  const serviceAccount = readServiceAccountConfig();
  if (serviceAccount) {
    return {
      accessToken: await getServiceAccountAccessToken(serviceAccount),
      authMode: 'service-account',
    };
  }

  const refreshToken = settings?.googleAnalytics?.refreshToken?.trim();
  if (!refreshToken) {
    throw new Error('Google Analytics não ligado.');
  }

  const refreshed = await refreshGoogleAnalyticsAccessToken(refreshToken);
  if (!refreshed.accessToken) {
    throw new Error(refreshed.error || 'Falha ao renovar acesso ao Google Analytics.');
  }

  return { accessToken: refreshed.accessToken, authMode: 'oauth' };
}

type AdminAccountSummary = {
  accountSummaries?: Array<{
    propertySummaries?: Array<{ property?: string; displayName?: string }>;
  }>;
};

type AdminDataStreams = {
  dataStreams?: Array<{
    name?: string;
    webStreamData?: { measurementId?: string };
  }>;
};

export async function findPropertyIdByMeasurementId(
  accessToken: string,
  measurementId: string,
): Promise<string | null> {
  const summariesRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!summariesRes.ok) return null;
  const summaries = (await summariesRes.json()) as AdminAccountSummary;

  for (const account of summaries.accountSummaries ?? []) {
    for (const property of account.propertySummaries ?? []) {
      const propertyName = property.property;
      if (!propertyName) continue;

      const streamsRes = await fetch(
        `https://analyticsadmin.googleapis.com/v1beta/${propertyName}/dataStreams`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        },
      );

      if (!streamsRes.ok) continue;
      const streams = (await streamsRes.json()) as AdminDataStreams;

      for (const stream of streams.dataStreams ?? []) {
        if (stream.webStreamData?.measurementId === measurementId) {
          return propertyName.replace(/^properties\//, '');
        }
      }
    }
  }

  return null;
}

type RealtimeApiResponse = {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
  totals?: Array<{
    metricValues?: Array<{ value?: string }>;
  }>;
};

function readMetricValue(value?: string): number {
  const parsed = Number(value ?? '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapBreakdownRows(
  response: RealtimeApiResponse,
  dimensionIndex = 0,
  limit = 8,
): Ga4BreakdownRow[] {
  return (response.rows ?? [])
    .map((row) => ({
      label: row.dimensionValues?.[dimensionIndex]?.value?.trim() || '(not set)',
      activeUsers: readMetricValue(row.metricValues?.[0]?.value),
    }))
    .filter((row) => row.activeUsers > 0)
    .sort((a, b) => b.activeUsers - a.activeUsers)
    .slice(0, limit);
}

async function runRealtimeReport(
  accessToken: string,
  propertyId: string,
  dimensions: string[],
): Promise<RealtimeApiResponse> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({
        dimensions: dimensions.map((name) => ({ name })),
        metrics: [{ name: 'activeUsers' }],
        limit: 10,
      }),
    },
  );

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(errorBody.error?.message || `Erro GA4 (${res.status}).`);
  }

  return (await res.json()) as RealtimeApiResponse;
}

export function isGoogleAnalyticsConfigured(settings?: SiteSettingsPayload | null): boolean {
  if (readServiceAccountConfig() && getPropertyId(settings)) return true;
  return Boolean(settings?.googleAnalytics?.refreshToken?.trim());
}

export async function fetchGa4RealtimeSnapshot(
  settings?: SiteSettingsPayload | null,
): Promise<Ga4RealtimeSnapshot> {
  const measurementId = getMeasurementId(settings);
  const propertyId = getPropertyId(settings);
  const base: Ga4RealtimeSnapshot = {
    configured: false,
    measurementId,
    propertyId,
    activeUsers: 0,
    pages: [],
    countries: [],
    devices: [],
    sources: [],
    updatedAt: new Date().toISOString(),
    authMode: null,
  };

  if (!propertyId) {
    return {
      ...base,
      error: 'Defina GA4_PROPERTY_ID ou ligue a conta Google Analytics.',
    };
  }

  try {
    const { accessToken, authMode } = await getAnalyticsAccessToken(settings);
    const [totalRes, countriesRes, pagesRes, devicesRes, sourcesRes] = await Promise.all([
      runRealtimeReport(accessToken, propertyId, []),
      runRealtimeReport(accessToken, propertyId, ['country']),
      runRealtimeReport(accessToken, propertyId, ['unifiedScreenName']),
      runRealtimeReport(accessToken, propertyId, ['deviceCategory']),
      runRealtimeReport(accessToken, propertyId, ['sessionSource']),
    ]);

    const activeUsers =
      readMetricValue(totalRes.totals?.[0]?.metricValues?.[0]?.value) ||
      (totalRes.rows ?? []).reduce(
        (sum, row) => sum + readMetricValue(row.metricValues?.[0]?.value),
        0,
      );

    return {
      configured: true,
      measurementId,
      propertyId,
      activeUsers,
      countries: mapBreakdownRows(countriesRes),
      pages: mapBreakdownRows(pagesRes),
      devices: mapBreakdownRows(devicesRes),
      sources: mapBreakdownRows(sourcesRes),
      updatedAt: new Date().toISOString(),
      authMode,
    };
  } catch (error) {
    return {
      ...base,
      error: error instanceof Error ? error.message : 'Erro ao carregar Google Analytics.',
    };
  }
}

export async function fetchGoogleAccountEmail(accessToken: string): Promise<string | null> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { email?: string };
  return data.email?.trim() || null;
}
