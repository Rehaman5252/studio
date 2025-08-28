
export interface Ad {
    type: 'image' | 'video';
    url: string;
    title: string;
    duration: number; // in seconds
    skippableAfter: number; // in seconds
    hint?: string; // for image data-ai-hint
}

// This adLibrary is for ads that are shown for specific actions,
// like getting a hint or viewing results.
export const adLibrary: {
    hintAds: Ad[];
    resultsAd: Ad;
} = {
    hintAds: [
        // Question 1 Hint
        { type: 'image', url: 'https://picsum.photos/400/225', title: 'Hint by KFC', hint: 'food chicken', duration: 7, skippableAfter: 5 },
        // Question 2 Hint
        { type: 'image', url: 'https://picsum.photos/400/225', title: 'Hint by Ceat Tyres', hint: 'tyres car', duration: 7, skippableAfter: 5 },
        // Question 3 Hint
        { type: 'image', url: 'https://picsum.photos/400/225', title: 'Hint by MESA School', hint: 'education school', duration: 7, skippableAfter: 5 },
        // Question 4 Hint
        { type: 'image', url: 'https://picsum.photos/400/225', title: 'Hint by Swiggy', hint: 'food delivery', duration: 7, skippableAfter: 5 },
        // Question 5 Hint
        { type: 'image', url: 'https://picsum.photos/400/225', title: 'Hint by HDFC Bank', hint: 'finance bank', duration: 7, skippableAfter: 5 },
    ],
    resultsAd: {
        type: 'video',
        url: 'https://videos.pexels.com/video-files/5993356/5993356-hd_1920_1080_25fps.mp4',
        title: 'Answers sponsored by: Indigo Airlines',
        duration: 30,
        skippableAfter: 15,
    }
};

// This interstitialAds config is for ads shown between questions.
export interface InterstitialAdConfig {
    type: 'static' | 'video';
    // For static ads
    logoUrl?: string;
    logoHint?: string;
    durationMs?: number; // duration in milliseconds for static loader
    // For video ads
    videoUrl?: string;
    videoTitle?: string;
    durationSec?: number; // duration in seconds for video
    skippableAfterSec?: number; // skippable after seconds for video
}
  
export const interstitialAds: { [key: number]: InterstitialAdConfig } = {
    // After question 1 (index 0) -> Show a 2s static ad
    0: {
        type: 'static',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg',
        logoHint: 'BMW logo',
        durationMs: 2000,
    },
    // After question 2 (index 1) -> Show a 2s static ad
    1: {
        type: 'static',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/74/Dominos_pizza_logo.svg',
        logoHint: 'Dominos logo',
        durationMs: 2000,
    },
    // After question 4 (index 3) -> Show a 2s static ad
    3: {
        type: 'static',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg',
        logoHint: 'Nike logo',
        durationMs: 2000,
    },
};
