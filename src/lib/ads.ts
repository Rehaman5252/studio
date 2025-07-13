
export interface Ad {
    type: 'image' | 'video';
    url: string;
    title: string;
    duration: number;
    skippableAfter: number;
    hint?: string; // for image data-ai-hint
}

export const adLibrary: {
    hintAds: Ad[];
    midQuizAd: Ad;
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
    midQuizAd: {
        type: 'video',
        // Royalty-free video from Pexels
        url: 'https://videos.pexels.com/video-files/8560088/8560088-hd_1366_720_30fps.mp4',
        title: 'Strategic Timeout',
        duration: 20,
        skippableAfter: 10,
    },
    resultsAd: {
        type: 'video',
        // Royalty-free video from Pexels
        url: 'https://videos.pexels.com/video-files/5993356/5993356-hd_1920_1080_25fps.mp4',
        title: 'Answers sponsored by: Indigo Airlines',
        duration: 30,
        skippableAfter: 15,
    }
};


export interface InterstitialAdConfig {
    logoUrl: string;
    logoHint: string;
    duration: number;
    type: 'static' | 'video';
    videoUrl?: string;
    skippableAfter?: number;
}
  
export const interstitialAds: { [key: number]: InterstitialAdConfig } = {
    // After question 1 (index 0)
    0: {
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/2048px-BMW.svg.png',
        logoHint: 'BMW logo',
        duration: 2000,
        type: 'static',
    },
    // After question 2 (index 1)
    1: {
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Domino%27s_pizza_logo.svg/2048px-Domino%27s_pizza_logo.svg.png',
        logoHint: 'Dominos logo',
        duration: 2000,
        type: 'static',
    },
    // After question 3 (index 2)
    2: {
        logoUrl: '', // Not used for video ad dialog
        logoHint: '',
        duration: 15000,
        type: 'video',
        videoUrl: 'https://videos.pexels.com/video-files/8560088/8560088-hd_1366_720_30fps.mp4',
        skippableAfter: 10,
    },
    // After question 4 (index 3)
    3: {
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Pepsi_logo_2014.svg/2560px-Pepsi_logo_2014.svg.png',
        logoHint: 'Pepsi logo',
        duration: 2000,
        type: 'static',
    },
};
