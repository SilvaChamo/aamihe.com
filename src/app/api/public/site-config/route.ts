import { NextResponse } from 'next/server';
import { DEFAULT_SITE_PAGE_CONFIG, mergeSitePageConfig } from '@/lib/site-page-config';
import { loadSiteSettings } from '@/lib/supabase-settings';

export async function GET() {
  try {
    const settings = await loadSiteSettings();
    const pages = mergeSitePageConfig(settings?.publicPages ?? null);
    return NextResponse.json({
      success: true,
      pages,
      defaults: DEFAULT_SITE_PAGE_CONFIG,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: true,
      pages: DEFAULT_SITE_PAGE_CONFIG,
    });
  }
}
