export type HomeHeroContent = {
  eyebrow: string;
  kicker: string;
  titleLineOne: string;
  titleLineTwo: string;
  titleEmphasis: string;
  summary: string;
};

export type WhoHeroContent = {
  eyebrow: string;
  title: string;
  copy: string;
};

export type LeaderContent = {
  name: string;
  role: string;
  discipline: string;
  visualLabel: string;
  portrait: string;
  biographyOne: string;
  biographyTwo: string;
  biographyThree: string;
};

export type FooterContent = {
  brandStatement: string;
  addressOne: string;
  addressTwo: string;
  addressThree: string;
  addressFour: string;
  addressFive: string;
  primaryEmail: string;
  secondaryEmail: string;
  phoneDisplay: string;
  phoneHref: string;
  linkedinUrl: string;
  instagramUrl: string;
  facebookUrl: string;
};

export type CmsContentMap = {
  "home.hero": HomeHeroContent;
  "who.hero": WhoHeroContent;
  "leader.aasim": LeaderContent;
  "leader.akhilesh": LeaderContent;
  "leader.anish": LeaderContent;
  "site.footer": FooterContent;
};

export type CmsKey = keyof CmsContentMap;

export type CmsField = {
  name: string;
  label: string;
  kind?: "text" | "email" | "tel" | "textarea" | "url";
  maxLength?: number;
  required?: boolean;
};

export type CmsDefinition<K extends CmsKey = CmsKey> = {
  key: K;
  title: string;
  description: string;
  route: string;
  fields: readonly CmsField[];
  fallback: CmsContentMap[K];
};

const leaderFields = [
  { name: "name", label: "Name", maxLength: 120 },
  { name: "role", label: "Role", maxLength: 180 },
  { name: "discipline", label: "Discipline", maxLength: 120 },
  { name: "visualLabel", label: "Card label", maxLength: 30 },
  { name: "portrait", label: "Media reservation label", maxLength: 120 },
  { name: "biographyOne", label: "Biography — introduction", kind: "textarea", maxLength: 1200 },
  { name: "biographyTwo", label: "Biography — experience", kind: "textarea", maxLength: 1800 },
  { name: "biographyThree", label: "Biography — Aureum role", kind: "textarea", maxLength: 1200 },
] as const;

export const CMS_DEFINITIONS = [
  {
    key: "home.hero",
    title: "Homepage hero",
    description: "Primary homepage positioning, headline and summary.",
    route: "/",
    fields: [
      { name: "eyebrow", label: "Eyebrow", maxLength: 100 },
      { name: "kicker", label: "Supporting line", kind: "textarea", maxLength: 240 },
      { name: "titleLineOne", label: "Headline — line one", maxLength: 120 },
      { name: "titleLineTwo", label: "Headline — line two", maxLength: 100 },
      { name: "titleEmphasis", label: "Headline — emphasized words", maxLength: 80 },
      { name: "summary", label: "Perspective summary", kind: "textarea", maxLength: 500 },
    ],
    fallback: {
      eyebrow: "The 360° Industrial Developer",
      kicker: "Intelligence-led development, from opportunity to performance.",
      titleLineOne: "Industrial opportunities",
      titleLineTwo: "take shape",
      titleEmphasis: "with us.",
      summary: "We unite intelligence, strategy and disciplined execution to turn industrial potential into enduring developments.",
    },
  },
  {
    key: "who.hero",
    title: "Who We Are hero",
    description: "Hero content for the Who We Are page.",
    route: "/who-we-are",
    fields: [
      { name: "eyebrow", label: "Eyebrow", maxLength: 100 },
      { name: "title", label: "Headline", kind: "textarea", maxLength: 240 },
      { name: "copy", label: "Introduction", kind: "textarea", maxLength: 600 },
    ],
    fallback: {
      eyebrow: "Who We Are",
      title: "Built around a different view of industrial development.",
      copy: "Industrial development is multi-disciplinary. Aureum brings the right commercial, technical and strategic thinking together to shape the opportunity from every angle.",
    },
  },
  {
    key: "leader.aasim",
    title: "Leadership — Aasim Ameer",
    description: "Leadership card and profile biography.",
    route: "/who-we-are",
    fields: leaderFields,
    fallback: {
      name: "Aasim Ameer",
      role: "Chief Executive Officer",
      discipline: "Executive Leadership",
      visualLabel: "CEO",
      portrait: "leadership-portrait-01.webp",
      biographyOne: "Leverages deep industry experience to strengthen Aureum’s ability to identify, de-risk and deliver high-yield, income-generating assets, aligning long-term value creation with investor goals.",
      biographyTwo: "An engineer from Loughborough University, UK, Aasim brings extensive technical expertise to Dubai’s industrial construction landscape. Since 2014, he has played a pivotal role in shaping a reputation for delivering high-performance, design-and-build industrial projects across the region.",
      biographyThree: "As CEO, he drives strategic direction, combining operational depth with an engineering-led approach to successfully deliver complex builds.",
    },
  },
  {
    key: "leader.akhilesh",
    title: "Leadership — Akhilesh Padinhare",
    description: "Leadership card and profile biography.",
    route: "/who-we-are",
    fields: leaderFields,
    fallback: {
      name: "Akhilesh Padinhare",
      role: "Executive Director in Investment and Strategy",
      discipline: "Investment & Strategy",
      visualLabel: "Invest",
      portrait: "leadership-portrait-02.webp",
      biographyOne: "Combines technical depth, market insight and financial acumen to guide Aureum’s investment strategy and steer high-performance developments in line with evolving industrial trends.",
      biographyTwo: "A Civil Engineer with over 25 years of experience in industrial development across Dubai and Abu Dhabi, Akhilesh brings a rare blend of technical expertise and strategic foresight. His deep familiarity with regulatory frameworks and compliance standards positions him as a critical link between design intent and project delivery.",
      biographyThree: "As Executive Director at Aureum, he leads with a sharp focus on commercial modeling, project controls and business strategy, ensuring each investment is both technically sound and financially optimized.",
    },
  },
  {
    key: "leader.anish",
    title: "Leadership — Anish Kasim",
    description: "Leadership card and profile biography.",
    route: "/who-we-are",
    fields: leaderFields,
    fallback: {
      name: "Anish Kasim",
      role: "Executive Director at Real Estate Development",
      discipline: "Real Estate Development",
      visualLabel: "Estate",
      portrait: "leadership-portrait-03.webp",
      biographyOne: "Brings deep operational insight and value-engineering expertise to ensure Aureum’s developments are buildable, cost-efficient and performance-led from concept to completion.",
      biographyTwo: "An Engineer with 30+ years of hands-on contracting experience, Anish has led the delivery of complex design-and-build industrial projects across the region. His strong command over construction methodologies, site execution and technical detailing makes him an invaluable anchor in translating design intent into high-performing assets.",
      biographyThree: "As Executive Director at Aureum, he plays a pivotal role in aligning construction execution with investor expectations.",
    },
  },
  {
    key: "site.footer",
    title: "Global footer",
    description: "Brand statement, office address and contact details used site-wide.",
    route: "/",
    fields: [
      { name: "brandStatement", label: "Brand statement", kind: "textarea", maxLength: 400 },
      { name: "addressOne", label: "Address — line one", maxLength: 160 },
      { name: "addressTwo", label: "Address — line two", maxLength: 120 },
      { name: "addressThree", label: "Address — line three", maxLength: 120 },
      { name: "addressFour", label: "Address — line four", maxLength: 160 },
      { name: "addressFive", label: "Address — line five", maxLength: 160 },
      { name: "primaryEmail", label: "Primary email", kind: "email", maxLength: 180 },
      { name: "secondaryEmail", label: "Secondary email", kind: "email", maxLength: 180, required: false },
      { name: "phoneDisplay", label: "Phone — displayed", kind: "tel", maxLength: 80 },
      { name: "phoneHref", label: "Phone — international link", kind: "tel", maxLength: 40 },
      { name: "linkedinUrl", label: "LinkedIn URL", kind: "url", maxLength: 300 },
      { name: "instagramUrl", label: "Instagram URL", kind: "url", maxLength: 300, required: false },
      { name: "facebookUrl", label: "Facebook URL", kind: "url", maxLength: 300, required: false },
    ],
    fallback: {
      brandStatement: "Intelligence, strategy and disciplined execution for enduring industrial developments.",
      addressOne: "Aureum Asset Management LLC. FZ",
      addressTwo: "602, Capricorn Tower",
      addressThree: "Trade Center Second",
      addressFour: "Dubai,",
      addressFive: "United Arab Emirates",
      primaryEmail: "info@aureum.ae",
      secondaryEmail: "",
      phoneDisplay: "04 234 8818",
      phoneHref: "+97142348818",
      linkedinUrl: "https://www.linkedin.com/company/www.aureum.ae/",
      instagramUrl: "https://www.instagram.com/aureum.ae/",
      facebookUrl: "",
    },
  },
] as const satisfies readonly CmsDefinition[];

export const cmsDefinitionByKey = Object.fromEntries(
  CMS_DEFINITIONS.map((definition) => [definition.key, definition]),
) as { [K in CmsKey]: Extract<(typeof CMS_DEFINITIONS)[number], { key: K }> };

export const cmsKeys = CMS_DEFINITIONS.map((definition) => definition.key) as CmsKey[];

export function isCmsKey(value: string): value is CmsKey {
  return cmsKeys.includes(value as CmsKey);
}
