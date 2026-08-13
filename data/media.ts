export type ApprovedMedia = {
  src: string;
  alt: string;
  focalPoint?: string;
};

// Add approved files to public/media, then map their existing reservation label
// here. Every current composition continues to work until its exact asset lands.
export const approvedMedia: Record<string, ApprovedMedia> = {};
