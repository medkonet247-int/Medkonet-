import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSiteImages } from '../context/SiteImagesContext';
import { IMAGE_SLOTS } from '../lib/constants';
import { DefaultArtwork } from '../components/DefaultArtwork';
import { PageShell, PageHeader, Card, Spinner, ErrorState, btnPrimary, btnSecondary } from '../components/ui';

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export function Media() {
  const { images, refresh } = useSiteImages();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { setLoading(false); }, []);

  async function handleReplace(slotKey: string, file: File | undefined) {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) { setError('Only JPG, PNG or WebP images are allowed.'); return; }
    if (file.size > MAX_BYTES) { setError('Image must be 3 MB or smaller.'); return; }
    setBusy(slotKey);
    setError('');
    setNotice('');
    try {
      const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
      const path = `${slotKey}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('site-images').upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const oldPath = images[slotKey] ? extractPath(images[slotKey].url) : null;
      const { data: session } = await supabase.auth.getSession();
      const { error: dbErr } = await supabase.from('site_images').upsert(
        { slot_key: slotKey, image_path: path, alt_text: IMAGE_SLOTS.find((s) => s.key === slotKey)?.alt ?? slotKey, updated_by: session.session?.user.id ?? null },
        { onConflict: 'slot_key' }
      );
      if (dbErr) throw dbErr;
      if (oldPath && oldPath !== path) {
        await supabase.storage.from('site-images').remove([oldPath]);
      }
      setNotice(`Image replaced for ${slotKey}. Changes are live without redeploying.`);
      await refresh();
    } catch {
      setError('We could not upload that image. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove(slotKey: string) {
    setBusy(slotKey);
    setError('');
    try {
      const oldPath = images[slotKey] ? extractPath(images[slotKey].url) : null;
      const { error: dbErr } = await supabase.from('site_images').delete().eq('slot_key', slotKey);
      if (dbErr) throw dbErr;
      if (oldPath) await supabase.storage.from('site-images').remove([oldPath]);
      setNotice(`Image removed for ${slotKey}. The generated default is now shown.`);
      setConfirmRemove(null);
      await refresh();
    } catch {
      setError('We could not remove that image. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  function extractPath(url: string): string | null {
    const marker = '/site-images/';
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
  }

  if (loading) return <PageShell><Spinner label="Loading media…" /></PageShell>;

  return (
    <PageShell>
      <PageHeader title="Media Manager" intro="Replace or remove public site images. Uploads go to the site-images bucket (publicly readable, admin-writable). JPG, PNG or WebP, up to 3 MB." />
      {error && <div className="mb-4"><ErrorState message={error} /></div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-[15px] text-green-900">{notice}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        {IMAGE_SLOTS.map((slot) => {
          const custom = images[slot.key];
          return (
            <Card key={slot.key}>
              <h2 className="font-bold text-navy">{slot.label}</h2>
              <p className="text-sm text-slate-500">Slot: {slot.key}</p>
              <figure className="mt-3 aspect-[16/9] overflow-hidden rounded-xl border border-slate-200" aria-label={custom?.alt || slot.alt}>
                {custom ? <img src={custom.url} alt={custom.alt || slot.alt} className="h-full w-full object-cover" /> : <DefaultArtwork slotKey={slot.key} />}
              </figure>
              <p className="mt-2 text-sm text-slate-600">{custom ? 'Custom image (live)' : 'Generated default'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  ref={(el) => { fileRefs.current[slot.key] = el; }}
                  type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  aria-label={`Choose replacement image for ${slot.label}`}
                  onChange={(e) => handleReplace(slot.key, e.target.files?.[0])}
                />
                <button onClick={() => fileRefs.current[slot.key]?.click()} disabled={busy === slot.key} className={btnPrimary}>
                  {busy === slot.key ? 'Working…' : 'Replace'}
                </button>
                {custom && (
                  confirmRemove === slot.key ? (
                    <>
                      <button onClick={() => handleRemove(slot.key)} disabled={busy === slot.key} className={btnPrimary}>Confirm remove</button>
                      <button onClick={() => setConfirmRemove(null)} className={btnSecondary}>Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setConfirmRemove(slot.key)} className={btnSecondary}>Remove</button>
                  )
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
