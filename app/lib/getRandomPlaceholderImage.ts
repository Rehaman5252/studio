// app/lib/getRandomPlaceholderImage.ts
import placeholderImages from "./placeholder-images.json";

export function getRandomPlaceholderImage() {
  const images = placeholderImages.quizImages;
  if (!images || images.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
}
