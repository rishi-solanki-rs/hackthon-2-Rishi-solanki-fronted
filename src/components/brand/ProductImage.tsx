import React, { useEffect, useState } from 'react';
import { resolveItemImage, CATEGORY_IMAGE_KEY, ITEM_IMAGE_BASE, ListingCategory, getCatalogItem, matchCatalogItem } from '@sidekit/shared';
import { ItemIcon } from './sidekit-icons';
import { resolveItemIconName } from './itemIcons';

interface ProductImageProps {
  itemKey?: string;
  name?: string;
  category?: string;
  imageUrl?: string;
  className?: string;
  /** Show the "Illustrative photo" caption (use on larger images). */
  caption?: boolean;
  rounded?: string;
}

/**
 * Catalog photo for an item. Falls back to the category photo, then to the brand icon,
 * so an item never renders without a visual. Photos are illustrative, not the owner's item.
 */
export const ProductImage: React.FC<ProductImageProps> = ({
  itemKey,
  name,
  category,
  imageUrl,
  className = '',
  caption = false,
  rounded = 'rounded-xl',
}) => {
  const primary = imageUrl || resolveItemImage(itemKey, name, category);
  // Items outside the catalog borrow their category's photo; say so instead of implying it is the item
  const isCategoryPhoto = !imageUrl && !getCatalogItem(itemKey) && !matchCatalogItem(name);
  const photoKind = isCategoryPhoto ? 'category photo' : 'illustrative photo';
  const categoryKey = CATEGORY_IMAGE_KEY[(category as ListingCategory) || 'general'] || CATEGORY_IMAGE_KEY.general;
  const fallback = `${ITEM_IMAGE_BASE}/${categoryKey}.webp`;
  const [src, setSrc] = useState(primary);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(primary);
    setFailed(false);
  }, [primary]);

  const onError = () => {
    if (src !== fallback) setSrc(fallback);
    else setFailed(true);
  };

  return (
    <div className={`relative overflow-hidden bg-surface-secondary ${rounded} ${className}`}>
      {failed ? (
        <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--sk-brand-50)' }}>
          <ItemIcon name={resolveItemIconName(itemKey, name)} size={48} />
        </div>
      ) : (
        <img
          src={src}
          alt={name ? `${name} (${photoKind})` : ''}
          loading="lazy"
          decoding="async"
          onError={onError}
          className="w-full h-full object-cover"
          draggable={false}
        />
      )}
      {caption && !failed && (
        <span className="absolute bottom-1.5 right-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded bg-black/45 text-white/90 pointer-events-none">
          {isCategoryPhoto ? 'Category photo' : 'Illustrative photo'}
        </span>
      )}
    </div>
  );
};
