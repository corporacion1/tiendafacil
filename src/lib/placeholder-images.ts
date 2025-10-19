import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const { placeholderImages: PlaceHolderImages }: { placeholderImages: ImagePlaceholder[] } = data;

    