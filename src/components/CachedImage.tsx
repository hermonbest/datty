import React from 'react';
import { Image, ImageProps, ImageSourcePropType } from 'react-native';
import { useCachedImageUri } from '../services/imageCache';

export interface CachedImageProps extends Omit<ImageProps, 'source'> {
  source: ImageSourcePropType;
}

export const CachedImage: React.FC<CachedImageProps> = ({ source, ...props }) => {
  const remoteUri = typeof source === 'object' && source !== null && 'uri' in source && typeof source.uri === 'string'
    ? source.uri
    : null;

  const cachedUri = useCachedImageUri(remoteUri);

  const resolvedSource: ImageSourcePropType = remoteUri
    ? { ...(source as object), uri: cachedUri || remoteUri }
    : source;

  return <Image source={resolvedSource} {...props} />;
};
