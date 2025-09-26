
import placeholderImageData from "./placeholder-images.json";
import type { BrandLogo, OfferLogo, QuizImage } from './placeholder-images.json';

type ImageCategory = keyof typeof placeholderImageData;

type CategoryTypes = {
  brandLogos: BrandLogo;
  offerLogos: OfferLogo;
  quizImages: QuizImage;
};

/**
 * Returns a random image object from the specified category.
 * @param category "quizImages" | "brandLogos" | "offerLogos"
 */
export function getRandomImage<T extends ImageCategory>(category: T): CategoryTypes[T] {
  const images = placeholderImageData[category];
  if (!images || images.length === 0) {
    console.warn(`No images found for category: ${category}`);
    // Return a default placeholder to prevent crashes
    return {
        src: 'https://placehold.co/600x400',
        hint: 'placeholder',
        alt: 'Placeholder image',
        id: 'fallback'
    } as unknown as CategoryTypes[T];
  }
  const index = Math.floor(Math.random() * images.length);
  return images[index] as CategoryTypes[T];
}
