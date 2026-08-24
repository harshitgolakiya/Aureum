export type ApprovedMedia = {
  src: string;
  alt: string;
  focalPoint?: string;
};

export const homeHeroMedia = {
  videoSrc: "/media/heroes/aurium.mp4",
  posterSrc: "/media/heroes/home.webp",
} as const;

// Add approved files to public/media, then map their existing reservation label
// here. Every current composition continues to work until its exact asset lands.
export const approvedMedia: Record<string, ApprovedMedia> = {
  "leadership-group-portrait.webp": {
    src: "/leadership/team.webp",
    alt: "Aureum leadership team: Akhilesh Padinhare, Anish Kasim and Aasim Ameer",
    focalPoint: "50% 50%",
  },
  "leadership-portrait-01.webp": {
    src: "/leadership/aasim.webp",
    alt: "Portrait of Aasim Ameer, Chief Executive Officer",
    focalPoint: "50% 0%",
  },
  "leadership-portrait-02.webp": {
    src: "/leadership/akhi.webp",
    alt: "Portrait of Akhilesh Padinhare, Executive Director in Investment and Strategy",
    focalPoint: "50% 0%",
  },
  "leadership-portrait-03.webp": {
    src: "/leadership/anish.webp",
    alt: "Portrait of Anish Kasim, Executive Director at Real Estate Development",
    focalPoint: "50% 0%",
  },
  "project-hero.webp": {
    src: "/media/heroes/portfolio.webp",
    alt: "A modern logistics campus illuminated at blue hour",
    focalPoint: "68% 55%",
  },
  "article-hero.webp": {
    src: "/media/heroes/insights.webp",
    alt: "A logistics and infrastructure corridor at dawn",
    focalPoint: "65% 52%",
  },
};
