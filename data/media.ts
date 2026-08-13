export type ApprovedMedia = {
  src: string;
  alt: string;
  focalPoint?: string;
};

// Add approved files to public/media, then map their existing reservation label
// here. Every current composition continues to work until its exact asset lands.
export const approvedMedia: Record<string, ApprovedMedia> = {
  "project-hero.webp": {
    src: "/media/heroes/portfolio.png",
    alt: "A modern logistics campus illuminated at blue hour",
    focalPoint: "68% 55%",
  },
  "article-hero.webp": {
    src: "/media/heroes/insights.png",
    alt: "A logistics and infrastructure corridor at dawn",
    focalPoint: "65% 52%",
  },
};
