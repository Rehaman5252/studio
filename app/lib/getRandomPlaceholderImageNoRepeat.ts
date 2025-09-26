// app/lib/getRandomPlaceholderImageNoRepeat.ts
import placeholderImages from "./placeholder-images.json";

// Keeps track of images already used
let unusedImages = [...placeholderImages.quizImages];

export function getRandomPlaceholderImageNoRepeat() {
  if (!unusedImages || unusedImages.length === 0) {
    // Reset once all images have been used
    unusedImages = [...placeholderImages.quizImages];
  }

  const randomIndex = Math.floor(Math.random() * unusedImages.length);
  const selectedImage = unusedImages[randomIndex];

  // Remove the selected image from the unused pool
  unusedImages.splice(randomIndex, 1);

  return selectedImage;
}
