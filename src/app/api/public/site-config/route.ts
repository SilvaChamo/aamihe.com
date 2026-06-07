import { NextResponse } from 'next/server';
import {
  DEFAULT_SITE_GENERAL_CONFIG,
  settingsToGeneralConfig,
} from '@/lib/site-general-config';
import { DEFAULT_SITE_PAGE_CONFIG, mergeSitePageConfig } from '@/lib/site-page-config';
import { loadSiteSettings } from '@/lib/supabase-settings';

export const revalidate = 60;

let cachedPayload: {
  body: Record<string, unknown>;
  expiresAt: number;
} | null = null;

async function buildSiteConfigPayload() {
  const settings = await loadSiteSettings();
  const pages = mergeSitePageConfig(settings?.publicPages ?? null);
  const general = settingsToGeneralConfig(settings);
  return {
    success: true,
    pages,
    general,
    defaults: {
      pages: DEFAULT_SITE_PAGE_CONFIG,
      general: DEFAULT_SITE_GENERAL_CONFIG,
    },
  };
}

export async function GET() {
  try {
    const now = Date.now();
    if (cachedPayload && cachedPayload.expiresAt > now) {
      return NextResponse.json(cachedPayload.body, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    const body = await buildSiteConfigPayload();
    cachedPayload = {
      body,
      expiresAt: now + 60_000,
    };

    return NextResponse.json(body, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: true,
      pages: DEFAULT_SITE_PAGE_CONFIG,
      general: DEFAULT_SITE_GENERAL_CONFIG,
    });
  }
}
