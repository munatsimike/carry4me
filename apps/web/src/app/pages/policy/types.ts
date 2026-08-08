export type PolicySection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type PolicyPageContent = {
  title: string;
  description: string;
  lastUpdated?: string;
  sections: PolicySection[];
  /** Optional hero-style side image (e.g. About page). */
  imageSrc?: string;
  /** Soften side image so it sits further into the background. */
  imageMuted?: boolean;
  /** Optional faint image watermark behind page text (e.g. Safety Center). */
  watermarkSrc?: string;
};
