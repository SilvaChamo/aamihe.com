import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { compressImageBuffer, isCompressibleImageMime } from '@/lib/compress-image-buffer';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function ensureBucketExists(bucket: string) {
  const { data: existing, error: getError } = await supabaseAdmin.storage.getBucket(bucket);
  if (!getError && existing) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: '1MB',
  });

  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(createError.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'avatars';

    if (!file) {
      return NextResponse.json({ error: 'Nenhum ficheiro enviado' }, { status: 400 });
    }

    await ensureBucketExists(bucket);

    let buffer = Buffer.from(await file.arrayBuffer());
    let contentType = file.type || 'image/jpeg';
    if (isCompressibleImageMime(contentType)) {
      const compressed = await compressImageBuffer(buffer, contentType, file.name);
      buffer = Buffer.from(compressed.buffer);
      contentType = compressed.mimeType;
    } else if (buffer.length > 1024 * 1024) {
      return NextResponse.json({ error: 'Ficheiro demasiado grande (máx. 1 MB).' }, { status: 400 });
    }

    const fileExt = contentType === 'image/jpeg' ? 'jpg' : file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

    const { error } = await supabaseAdmin.storage.from(bucket).upload(fileName, buffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro no upload';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
