
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
        { type: 'image', url: 'https://placehold.co/400x225.png', title: 'Hint by KFC', hint: 'food chicken', duration: 7, skippableAfter: 5 },
        // Question 2 Hint
        { type: 'image', url: 'https://placehold.co/400x225.png', title: 'Hint by Ceat Tyres', hint: 'tyres car', duration: 7, skippableAfter: 5 },
        // Question 3 Hint
        { type: 'image', url: 'https://placehold.co/400x225.png', title: 'Hint by MESA School', hint: 'education school', duration: 7, skippableAfter: 5 },
        // Question 4 Hint
        { type: 'image', url: 'https://placehold.co/400x225.png', title: 'Hint by Swiggy', hint: 'food delivery', duration: 7, skippableAfter: 5 },
        // Question 5 Hint
        { type: 'image', url: 'https://placehold.co/400x225.png', title: 'Hint by HDFC Bank', hint: 'finance bank', duration: 7, skippableAfter: 5 },
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
    // After question 1 (index 0) -> Show BMW static ad for 2s
    0: {
        type: 'static',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/2048px-BMW.svg.png',
        logoHint: 'BMW logo',
        durationMs: 2000,
    },
    // After question 2 (index 1) -> Show Domino's static ad for 2s
    1: {
        type: 'static',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Domino%27s_pizza_logo.svg/2048px-Domino%27s_pizza_logo.svg.png',
        logoHint: 'Dominos logo',
        durationMs: 2000,
    },
    // After question 3 (index 2) -> Show a 15s video ad, skippable after 10s
    2: {
        type: 'video',
        videoUrl: 'https://videos.pexels.com/video-files/8560088/8560088-hd_1366_720_30fps.mp4',
        videoTitle: 'Strategic Timeout',
        durationSec: 15,
        skippableAfterSec: 10,
    },
    // After question 4 (index 3) -> Show Pepsi static ad for 2s
    3: {
        type: 'static',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Pepsi_logo_2014.svg/2560px-Pepsi_logo_2014.svg.png',
        logoHint: 'Pepsi logo',
        durationMs: 2000,
    },
};
