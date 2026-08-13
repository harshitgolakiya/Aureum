export const phases = [
  [
    "01",
    "Opportunity Intelligence",
    "Market intelligence, commercial evaluation and technical feasibility reveal where opportunity exists and how it can be shaped for long-term value.",
  ],
  [
    "02",
    "Development Strategy",
    "Commercial objectives, stakeholder priorities and technical requirements come together to shape a development strategy built for long-term value.",
  ],
  [
    "03",
    "Integrated Design",
    "Design brings strategy, technical requirements and operational needs together to shape a high-performing asset.",
  ],
  [
    "04",
    "Governed Delivery",
    "Disciplined execution keeps every decision aligned, every milestone accountable and the development true to its strategic intent.",
  ],
  [
    "05",
    "Operational Readiness",
    "Every development is shaped for how it will operate, bringing commissioning, transition and operational requirements into focus before handover.",
  ],
  [
    "06",
    "Asset Performance",
    "We position every development for sustained high-performance, long-term value and the demands of what comes next.",
  ],
] as const;
export const pillars = [
  {
    n: "01",
    title: "Industrial Intelligence",
    body: "Market analysis, opportunity identification, commercial evaluation and strategic positioning. Every development begins with understanding before action. We apply rigorous data-driven intelligence to identify opportunities positioned for sustained long-term performance.",
  },
  {
    n: "02",
    title: "Development Strategy",
    body: "Integrated planning that connects commercial objectives, technical requirements and operational readiness into one coherent development pathway. Strategy is not a phase. It is the thread that runs through every decision.",
  },
  {
    n: "03",
    title: "Disciplined Execution",
    body: "Governance-led delivery that ensures every milestone meets institutional standards of quality, compliance and long-term performance. We do not simply manage delivery. We govern it.",
  },
];
export const models = [
  {
    n: "01",
    title: "Predictive Development",
    lead: "We originate the opportunity.",
    body: "Market intelligence identifies where demand is heading. Aureum turns that insight into industrial developments positioned for long-term performance.",
  },
  {
    n: "02",
    title: "Development Management",
    lead: "We develop around your requirements.",
    body: "Aureum leads the development of industrial assets around specific occupier, commercial and operational requirements from land acquisition to planning and design through to delivery and operational readiness.",
  },
  {
    n: "03",
    title: "Strategic Partnerships",
    lead: "We align the right partners.",
    body: "We bring together land, occupier requirements and development expertise to connect capital to opportunities for shared long-term value.",
  },
];
export const projects = [
  {
    slug: "project-1",
    name: "[Project Name]",
    location: "[City, UAE]",
    type: "Grade A Logistics Hub",
    category: "Logistics",
    metric: "[Total GFA]",
    status: "[Operational / In Development]",
    philosophy:
      "[One sentence describing how Aureum's thinking shaped this development]",
    engagement: "[Predictive / Management / Partnership]",
  },
  {
    slug: "project-2",
    name: "[Project Name]",
    location: "[City, UAE]",
    type: "Industrial Park",
    category: "Industrial Parks",
    metric: "[Defining metric]",
    status: "[Operational / In Development]",
    philosophy:
      "[One sentence describing how Aureum's thinking shaped this development]",
    engagement: "[Predictive / Management / Partnership]",
  },
  {
    slug: "project-3",
    name: "[Project Name]",
    location: "[City, UAE]",
    type: "Distribution Centre",
    category: "Distribution",
    metric: "[Defining metric]",
    status: "[Operational / In Development]",
    philosophy:
      "[One sentence describing how Aureum's thinking shaped this development]",
    engagement: "[Predictive / Management / Partnership]",
  },
  {
    slug: "project-4",
    name: "[Project Name]",
    location: "[City, UAE]",
    type: "Mixed-Use Industrial Complex",
    category: "Mixed-Use",
    metric: "[Defining metric]",
    status: "[Operational / In Development]",
    philosophy:
      "[One sentence describing how Aureum's thinking shaped this development]",
    engagement: "[Predictive / Management / Partnership]",
  },
];
export const articles = [
  "[Article headline — editorial, forward-looking, insight-driven]",
  "[Industry perspective headline]",
  "[Thought leadership headline]",
];
export const insightArticles = [
  {
    slug: "article-1",
    category: "Market Intelligence",
    title: articles[0],
    excerpt: "[Two-line summary of the article's key perspective]",
    author: "[Author name]",
    authorTitle: "[Author title]",
    date: "[Publication date]",
    readTime: "[Read time]",
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
  },
];

export function isPendingContent(value: string) {
  return value.trim().startsWith("[") && value.trim().endsWith("]");
}

export function projectPresentation(
  project: (typeof projects)[number],
  index = projects.indexOf(project),
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
  article: (typeof insightArticles)[number],
  index = insightArticles.indexOf(article),
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
