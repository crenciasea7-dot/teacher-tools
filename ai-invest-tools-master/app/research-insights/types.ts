export type Direction = "positive" | "neutral" | "negative" | "uncertain";

export type ImpactItem = {
  direction: Direction;
  detail: string;
};

export type ResearchAnalysis = {
  summary: string;
  insights: string[];
  keywords: { word: string; weight: number }[];
  impact: {
    salePrice: ImpactItem;
    loan: ImpactItem;
    tax: ImpactItem;
    policy: ImpactItem;
    sentiment: ImpactItem;
  };
  actions: string[];
  recommendedTools: { name: string; reason: string }[];
  engine: "ai" | "local";
};

export type ResearchRecord = {
  id: string;
  title: string;
  category: string;
  source: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  original: Blob | null;
  analysis: ResearchAnalysis;
};
