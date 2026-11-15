import { useSiteImages } from '../context/SiteImagesContext';
import { DefaultArtwork } from './DefaultArtwork';
import { IMAGE_SLOTS } from '../lib/constants';

export function ImageSlot({ slotKey, className = '' }: { slotKey: string; className?: string }) {
  const { images } = useSiteImages();
  const slot = IMAGE_SLOTS.find((s) => s.key === slotKey);
  const custom = images[slotKey];
  const alt = custom?.alt || slot?.alt || slotKey;
  return (
    <figure className={`overflow-hidden rounded-2xl ${className}`} aria-label={alt}>
      {custom ? (
        <img src={custom.url} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <DefaultArtwork slotKey={slotKey} />
      )}
    </figure>
  );
}
