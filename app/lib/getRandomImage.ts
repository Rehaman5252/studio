
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
export function getRandomImage<T extends ImageCategory>(category: T): CategoryTypes[T] | null {
  const images = placeholderImageData[category];
  if (!images || images.length === 0) {
    console.warn(`No images found for category: ${category}`);
    return null;
  }
  const index = Math.floor(Math.random() * images.length);
  return images[index] as CategoryTypes[T];
}
