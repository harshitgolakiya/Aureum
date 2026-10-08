import { clientProjects } from "./client-projects";
import type { ProjectDetails } from "./project-details";

export const phases = [
  [
    "01",
    "Opportunity Intelligence",
    "Identifies the optimum development proposition for the land, market and demand.",
  ],
  [
    "02",
    "Development Strategy",
    "Structures the development proposition around clear commercial, technical and regulatory parameters.",
  ],
  [
    "03",
    "Opportunity Planning",
    "Translates development strategy into an integrated plan for land layout, asset configuration, phasing and delivery.",
  ],
  [
    "04",
    "Asset Realisation",
    "Transforms development strategy into assets that perform from day one.",
  ],
  [
    "05",
    "Operational Readiness",
    "Maps development configuration with occupier requirements, operational needs and the conditions for effective use.",
  ],
  [
    "06",
    "Asset Performance",
    "Positions developed assets for sustained operational, commercial and investment performance over its lifecycle.",
  ],
] as const;
export const pillars = [
  {
    n: "01",
    title: "Industrial Intelligence",
    body: "Turning market signals, land potential and industrial demand into high-performance development propositions built for lasting value.",
  },
  {
    n: "02",
    title: "Development Expertise",
    body: "Bringing industrial development expertise and a deep understanding of occupier requirements together to shape high-performance assets built around how industry operates.",
  },
  {
    n: "03",
    title: "Strategic Development Leadership",
    body: "Aligning investment and capital strategy with precise development management to create commercially grounded, high-performance assets built for long-term performance.",
  },
];
export const models = [
  {
    n: "01",
    title: "Predictive Development",
    qualifier: "Built-to-lease",
    lead: "We originate the opportunity.",
    body: "Market intelligence identifies where demand is heading. Aureum turns that insight into industrial developments positioned for long-term performance.",
  },
  {
    n: "02",
    title: "Purpose-Built Development",
    qualifier: "Built-to-suit",
    lead: "We develop around your requirements.",
    body: "Aureum develops fully functional industrial and logistics operations facilities built around specific occupier operational requirements.",
  },
  {
    n: "03",
    title: "Strategic Development Partnerships",
    qualifier: "",
    lead: "We align the right partners.",
    body: "We bring together land, occupier requirements and development expertise to connect capital to opportunities for long-term value.",
  },
];
export type CmsWorkflowStatus = "draft" | "scheduled" | "published" | "unpublished" | "archived";

export type Project = {
  details?: ProjectDetails;
  slug: string;
  name: string;
  location: string;
  type: string;
  category: string;
  metric: string;
  status: string;
  philosophy: string;
  engagement: string;
  coverImage: string;
  opportunity: string;
  strategy: string;
  delivery: string;
  outcome: string;
  chapterOrder: string;
  galleryImages: string;
  homepageFeatured: boolean;
  homepageImage: string;
  homepageHeadline: string;
  homepageSubline: string;
  homepageSpecs: string;
  homepageTagline: string;
  homepageTaglineSub: string;
  homepageClosing: string;
  homepageServices: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  searchIndex: boolean;
  searchFollow: boolean;
  socialTitle: string;
  socialDescription: string;
  socialImage: string;
  published: boolean;
  archived: boolean;
  workflowStatus: CmsWorkflowStatus;
  scheduledAt: string;
  sortOrder: number;
};

export type InsightArticle = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  authorTitle: string;
  date: string;
  readTime: string;
  coverImage: string;
  body: string;
  bodyDocument: string;
  pullQuote: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  searchIndex: boolean;
  searchFollow: boolean;
  socialTitle: string;
  socialDescription: string;
  socialImage: string;
  published: boolean;
  featured: boolean;
  archived: boolean;
  workflowStatus: CmsWorkflowStatus;
  scheduledAt: string;
  sortOrder: number;
};

// Client brochure facilities also used when the CMS connection is unavailable.
export const projects: Project[] = clientProjects;
export const articles = [
  "[Article headline — editorial, forward-looking, insight-driven]",
  "[Industry perspective headline]",
  "[Thought leadership headline]",
];
export const insightArticles: InsightArticle[] = [
  {
    slug: "article-1",
    category: "Market Intelligence",
    title: articles[0],
    excerpt: "[Two-line summary of the article's key perspective]",
    author: "[Author name]",
    authorTitle: "[Author title]",
    date: "[Publication date]",
    readTime: "[Read time]",
    coverImage: "/media/heroes/insights.webp",
    body: "Article content has not yet been supplied. This reading template is ready for approved Aureum insight content.",
    bodyDocument: "",
    pullQuote: "Approved pull quote pending.",
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
    searchIndex: true,
    searchFollow: true,
    socialTitle: "",
    socialDescription: "",
    socialImage: "",
    published: true,
    featured: true,
    archived: false,
    workflowStatus: "published",
    scheduledAt: "",
    sortOrder: 10,
  },
  {
    slug: "article-2",
    category: "Industry Perspective",
    title: articles[1],
    excerpt: "[Two-line summary of the article's key perspective]",
    author: "[Author name]",
    authorTitle: "[Author title]",
    date: "[Publication date]",
    readTime: "[Read time]",
    coverImage: "/media/heroes/insights.webp",
    body: "Article content has not yet been supplied. This reading template is ready for approved Aureum insight content.",
    bodyDocument: "",
    pullQuote: "Approved pull quote pending.",
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
    searchIndex: true,
    searchFollow: true,
    socialTitle: "",
    socialDescription: "",
    socialImage: "",
    published: true,
    featured: false,
    archived: false,
    workflowStatus: "published",
    scheduledAt: "",
    sortOrder: 20,
  },
  {
    slug: "article-3",
    category: "Thought Leadership",
    title: articles[2],
    excerpt: "[Two-line summary of the article's key perspective]",
    author: "[Author name]",
    authorTitle: "[Author title]",
    date: "[Publication date]",
    readTime: "[Read time]",
    coverImage: "/media/heroes/insights.webp",
    body: "Article content has not yet been supplied. This reading template is ready for approved Aureum insight content.",
    bodyDocument: "",
    pullQuote: "Approved pull quote pending.",
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
    searchIndex: true,
    searchFollow: true,
    socialTitle: "",
    socialDescription: "",
    socialImage: "",
    published: true,
    featured: false,
    archived: false,
    workflowStatus: "published",
    scheduledAt: "",
    sortOrder: 30,
  },
];

export function isPendingContent(value: string) {
  return value.trim().startsWith("[") && value.trim().endsWith("]");
}

export function projectPresentation(
  project: Project,
  index = Math.max(0, projects.findIndex((item) => item.slug === project.slug)),
) {
  return {
    name: isPendingContent(project.name)
      ? `Development ${String(index + 1).padStart(2, "0")}`
      : project.name,
    location: isPendingContent(project.location)
      ? "Location pending approval"
      : project.location,
    status: isPendingContent(project.status)
      ? "Status pending approval"
      : project.status,
    metric: isPendingContent(project.metric)
      ? "Metric pending approval"
      : project.metric,
    philosophy: isPendingContent(project.philosophy)
      ? "Approved development narrative pending."
      : project.philosophy,
  };
}

export function insightPresentation(
  article: InsightArticle,
  index = Math.max(0, insightArticles.findIndex((item) => item.slug === article.slug)),
) {
  return {
    title: isPendingContent(article.title)
      ? `Aureum Insight ${String(index + 1).padStart(2, "0")}`
      : article.title,
    excerpt: isPendingContent(article.excerpt)
      ? "Approved editorial summary pending."
      : article.excerpt,
    author: isPendingContent(article.author)
      ? "Author pending"
      : article.author,
    authorTitle: isPendingContent(article.authorTitle)
      ? "Contributor details pending"
      : article.authorTitle,
    date: isPendingContent(article.date) ? "Publication pending" : article.date,
    readTime: isPendingContent(article.readTime)
      ? "Reading time pending"
      : article.readTime,
  };
}
