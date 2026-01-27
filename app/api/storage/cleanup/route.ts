import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const normalizeStoragePath = (value: string): string => {
  let path = String(value || '').trim();
  path = path.replace(/^\/+/, '');
  path = path.split('?')[0].split('#')[0];
  try {
    path = decodeURIComponent(path);
  } catch {
  }
  if (path.startsWith('character-images/')) {
    path = path.slice('character-images/'.length);
  }
  return path;
};

const extractStoragePathFromUrl = (rawUrl: string): string | null => {
  const raw = String(rawUrl || '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const parts = url.pathname.split('/').filter(Boolean);
    const markerIndex = parts.findIndex((part) => part === 'public' || part === 'sign');
    if (markerIndex !== -1 && parts.length > markerIndex + 2) {
      return normalizeStoragePath(parts.slice(markerIndex + 2).join('/'));
    }
    return normalizeStoragePath(url.pathname);
  } catch {
    return normalizeStoragePath(raw);
  }
};

const listAllStorageFilesRecursive = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  path = ''
): Promise<string[]> => {
  const out: string[] = [];
  const limit = 100;
  let offset = 0;

  while (true) {
    const { data, error } = await supabaseAdmin.storage
      .from('character-images')
      .list(path, { limit, offset });

    if (error) {
      throw new Error(`Failed to list storage files: ${error.message}`);
    }

    const batch = data || [];

    for (const item of batch) {
      const name = typeof (item as any)?.name === 'string' ? String((item as any).name) : '';
      if (!name) continue;

      const isFolder = !(item as any)?.id && !(item as any)?.metadata;
      if (isFolder) {
        const nextPath = path ? `${path}/${name}` : name;
        const nested = await listAllStorageFilesRecursive(supabaseAdmin, nextPath);
        out.push(...nested);
      } else {
        const fullPath = path ? `${path}/${name}` : name;
        out.push(fullPath);
      }
    }

    if (batch.length < limit) break;
    offset += batch.length;
  }

  return out;
};

const listUserOwnedStorageObjectNames = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string
): Promise<string[] | null> => {
  try {
    const storageSchema = (supabaseAdmin as any).schema?.('storage');
    if (!storageSchema) {
      return null;
    }

    const { data, error } = await storageSchema
      .from('objects')
      .select('name')
      .eq('bucket_id', 'character-images')
      .eq('owner', userId);

    if (error) {
      return null;
    }

    return (data || [])
      .map((row: any) => (typeof row?.name === 'string' ? row.name : ''))
      .filter(Boolean);
  } catch {
    return null;
  }
};

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Server not configured for storage cleanup' },
        { status: 500 }
      );
    }

    const authorization = request.headers.get('authorization') || '';
    const token = authorization.toLowerCase().startsWith('bearer ')
      ? authorization.slice('bearer '.length).trim()
      : '';

    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Invalid authorization token' }, { status: 401 });
    }

    const userId = userData.user.id;

    const body = await request.json().catch(() => ({}));
    const dryRun = Boolean((body as any)?.dryRun);

    const ownedObjectNames = await listUserOwnedStorageObjectNames(supabaseAdmin, userId);
    const allFilePaths = await listAllStorageFilesRecursive(supabaseAdmin, '');
    const useOwnership = Array.isArray(ownedObjectNames) && ownedObjectNames.length > 0;
    const ownershipMode = useOwnership
      ? 'storage.objects(owner=user)'
      : Array.isArray(ownedObjectNames)
        ? 'storage.objects(empty->fallback_list)'
        : 'storage.list(fallback)';

    // If we can't scope storage objects by owner, we must avoid deleting other users' files.
    // The safe strategy is to only delete objects that are unreferenced by ANY row in
    // character_images (global reference scope).
    const referenceScope = useOwnership ? 'user' : 'global';

    const filePaths = useOwnership ? ownedObjectNames : allFilePaths;

    let dbImagesQuery = supabaseAdmin
      .from('character_images')
      .select('file_name, image_url');

    if (referenceScope === 'user') {
      dbImagesQuery = dbImagesQuery.eq('user_id', userId);
    }

    const { data: dbImages, error: dbError } = await dbImagesQuery;

    if (dbError) {
      return NextResponse.json(
        { error: `Failed to fetch database records: ${dbError.message}` },
        { status: 500 }
      );
    }

    const usedFileNames = new Set<string>();

    for (const img of dbImages || []) {
      const fileName = typeof (img as any).file_name === 'string'
        ? normalizeStoragePath((img as any).file_name)
        : '';
      if (fileName) usedFileNames.add(fileName);

      const urlPath = typeof (img as any).image_url === 'string'
        ? extractStoragePathFromUrl((img as any).image_url)
        : null;
      if (urlPath) usedFileNames.add(urlPath);
    }

    let referencedCount = 0;
    let unreferencedCount = 0;
    let unreferencedRejectedBySafetyFilterCount = 0;
    const sampleUnreferenced: string[] = [];
    const sampleRejectedBySafetyFilter: string[] = [];

    const orphanedFilePaths: string[] = [];

    for (const p of filePaths) {
      const normalized = normalizeStoragePath(p);
      if (!normalized) continue;

      if (usedFileNames.has(normalized)) {
        referencedCount += 1;
        continue;
      }

      unreferencedCount += 1;
      if (sampleUnreferenced.length < 20) sampleUnreferenced.push(normalized);

      orphanedFilePaths.push(normalized);
    }

    if (orphanedFilePaths.length === 0) {
      return NextResponse.json({
        dryRun,
        orphanedCount: 0,
        deletedCount: 0,
        failedCount: 0,
        debug: {
          ownershipMode,
          referenceScope,
          allFilesInBucket: allFilePaths.length,
          ownedFilesByUser: Array.isArray(ownedObjectNames) ? ownedObjectNames.length : null,
          totalFilesConsidered: filePaths.length,
          referencedPaths: usedFileNames.size,
          referencedCount,
          unreferencedCount,
          unreferencedRejectedBySafetyFilterCount,
          sampleUnreferenced,
          sampleRejectedBySafetyFilter,
          sampleFilesConsidered: filePaths.slice(0, 20),
        },
      });
    }

    if (dryRun) {
      return NextResponse.json({
        dryRun,
        orphanedCount: orphanedFilePaths.length,
        deletedCount: 0,
        failedCount: 0,
        debug: {
          ownershipMode,
          allFilesInBucket: allFilePaths.length,
          ownedFilesByUser: Array.isArray(ownedObjectNames) ? ownedObjectNames.length : null,
          totalFilesConsidered: filePaths.length,
          referencedPaths: usedFileNames.size,
          sampleOrphans: orphanedFilePaths.slice(0, 20),
          sampleFilesConsidered: filePaths.slice(0, 20),
        },
      });
    }

    const results: Array<{ file: string; success: boolean; error?: string }> = [];
    const chunkSize = 50;

    for (let i = 0; i < orphanedFilePaths.length; i += chunkSize) {
      const chunk = orphanedFilePaths.slice(i, i + chunkSize);
      const names = chunk.map((p) => normalizeStoragePath(p)).filter(Boolean);

      const { error } = await supabaseAdmin.storage.from('character-images').remove(names);

      if (error) {
        for (const name of names) {
          results.push({ file: name, success: false, error: error.message });
        }
        continue;
      }

      for (const name of names) {
        results.push({ file: name, success: true });
      }
    }

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return NextResponse.json({
      dryRun,
      orphanedCount: orphanedFilePaths.length,
      deletedCount: successful.length,
      failedCount: failed.length,
      debug: {
        ownershipMode,
        referenceScope,
        allFilesInBucket: allFilePaths.length,
        ownedFilesByUser: Array.isArray(ownedObjectNames) ? ownedObjectNames.length : null,
        totalFilesConsidered: filePaths.length,
        referencedPaths: usedFileNames.size,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to cleanup storage' },
      { status: 500 }
    );
  }
}
