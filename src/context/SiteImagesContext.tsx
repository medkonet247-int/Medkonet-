import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface SiteImagesCtx {
  images: Record<string, { url: string; alt: string }>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<SiteImagesCtx>({ images: {}, loading: true, refresh: async () => {} });
export function useSiteImages() { return useContext(Ctx); }

export function SiteImagesProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<Record<string, { url: string; alt: string }>>({});
  const [loading, setLoading] = useState(true);

  async function refresh() {
    // One request for all slots; defaults render immediately (no flicker).
    const { data } = await supabase.from('site_images').select('slot_key,image_path,alt_text');
    const map: Record<string, { url: string; alt: string }> = {};
    for (const row of data ?? []) {
      const { data: pub } = supabase.storage.from('site-images').getPublicUrl(row.image_path);
      map[row.slot_key] = { url: pub.publicUrl, alt: row.alt_text || '' };
    }
    setImages(map);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  return <Ctx.Provider value={{ images, loading, refresh }}>{children}</Ctx.Provider>;
}
