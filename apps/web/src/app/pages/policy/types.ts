export type PolicySection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type PolicyPageContent = {
  title: string;
  description: string;
  lastUpdated: string;
  sections: PolicySection[];
};
