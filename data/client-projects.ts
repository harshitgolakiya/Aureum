import type { Project } from "./site";
import { emptyProjectDetails } from "./project-details";

const advantages = ["Custom designed to operational requirements", "Improved operational efficiency", "Scalability and future expansion", "Optimized capital expenditure", "Long-term cost certainty and security", "Leasehold"];
const operationalArea = "Operational area (warehouse and offices), excluding utilities and service areas.";
const builtAround = { title: "Built around your business", body: "From concept to completion, we deliver tailored industrial facilities that drive productivity, efficiency, and growth." };
const defaults: Project = {
  slug: "", name: "", location: "", type: "", category: "", metric: "", status: "", philosophy: "", engagement: "",
  coverImage: "", opportunity: "", strategy: "", delivery: "", outcome: "", chapterOrder: "", galleryImages: "",
  homepageFeatured: true, homepageImage: "", homepageHeadline: "", homepageSubline: "", homepageSpecs: "", homepageTagline: "", homepageTaglineSub: "", homepageClosing: "", homepageServices: "",
  seoTitle: "", seoDescription: "", canonicalUrl: "", searchIndex: true, searchFollow: true, socialTitle: "", socialDescription: "", socialImage: "",
  published: true, archived: false, workflowStatus: "published", scheduledAt: "", sortOrder: 0,
};
const contact = { contactName: "Tejeshree (TJ)", contactPhone: "+971 55 689 4660" };

// Facility names follow the supplied filenames; no unprovided location or contract data is inferred.
export const clientProjects: Project[] = [
  {
    ...defaults, slug: "aureum-logistics", name: "Aureum Logistics", type: "Independent Grade A logistics facility", category: "Trading & Logistics", metric: "Approx. 7,963 sqm operational area", status: "Build-to-suit opportunity", engagement: "Lease", sortOrder: 10,
    philosophy: "Secure a purpose-built, independent Grade A logistics facility tailored to your operational requirements, with the flexibility to integrate your specifications from the outset.",
    details: { ...emptyProjectDetails(), ...contact, headline: "Secure your facility before construction", offering: "Build-to-suit opportunity | Lease | Flexible to end-user requirements", brochure: "/Aureum Logistics.pdf", imageCaption: "Illustrative development concept",
      specifications: [
        { label: "Approx. plot size", value: "12,465 sqm", note: "" },
        { label: "Approx. built-up area", value: "7,963 sqm", note: operationalArea },
        { label: "Proposed eaves height", value: "15 m", note: "" },
        { label: "Pallet capacity", value: "Approx. 16,000 positions", note: "" },
        { label: "Temperature control", value: "24°C", note: "Temperature controlled" },
      ], featuresTitle: "Key advantages of build-to-suit", features: advantages, sections: [builtAround, { title: "Our priorities", body: "Quality. Safety. Sustainability. Partnership." }],
    },
  },
  {
    ...defaults, slug: "aureum-skyline", name: "Aureum Skyline", type: "Independent Grade A warehouse", category: "Trading & Logistics", metric: "Approx. 3,167 sqm built-up area", status: "Ready to move in", engagement: "Lease", sortOrder: 20,
    philosophy: "Grade A facility designed for a single occupier and ready for operations. Enabling efficient inventory management, seamless connectivity, and enhanced operational efficiency.",
    details: { ...emptyProjectDetails(), ...contact, headline: "Ready-to-move-in independent Grade A warehouse", offering: "Lease", brochure: "/Aureum Skyline.pdf", imageCaption: "Site photography",
      specifications: [
        { label: "Approx. plot size", value: "5,000 sqm", note: "" },
        { label: "Approx. built-up area", value: "3,167 sqm", note: "" },
        { label: "Eaves height", value: "12.5 m", note: "" },
        { label: "Temperature control", value: "Ambient temperature", note: "" },
      ], sectors: ["FMCG", "Food & Beverage", "Consumer Goods", "Electronics", "Automotive", "Healthcare"], sections: [{ title: "Multimodal connectivity", body: "Strategically positioned to offer multimodal connectivity, with seamless access to road, sea, and air networks." }],
    },
  },
  {
    ...defaults, slug: "aureum-trading", name: "Aureum Trading", type: "Purpose-built industrial facility", category: "Trading & Logistics", metric: "Approx. 1,450 sqm operational area", status: "Build-to-suit opportunity", engagement: "Build-to-own", sortOrder: 30,
    philosophy: "A unique opportunity to own a purpose-built industrial facility, developed to meet your operational requirements. From design and specifications to construction, Aureum can work with you to deliver a facility tailored to your business.",
    details: { ...emptyProjectDetails(), ...contact, headline: "Own the facility built around your business", offering: "Build-to-own | Build-to-suit | Independent development", brochure: "/Aureum Trading.pdf", imageCaption: "Illustrative development concept",
      specifications: [
        { label: "Approx. plot size", value: "2,500 sqm", note: "" },
        { label: "Approx. built-up area", value: "1,450 sqm", note: operationalArea },
        { label: "Proposed eaves height", value: "12 m", note: "" },
        { label: "Temperature control", value: "Ambient or temperature-controlled options", note: "Can be considered based on your requirements." },
      ], featuresTitle: "Key advantages of build-to-suit", features: advantages, sections: [builtAround, { title: "Our priorities", body: "Quality. Safety. Sustainability. Partnership." }],
    },
  },
  {
    ...defaults, slug: "aureum-office-building", name: "Aureum Office Building", location: "JAFZA (North)", type: "Fully furnished independent office building", category: "Commercial Office", metric: "14,000 sq ft total built-up area", status: "Immediate availability", engagement: "Lease", sortOrder: 40,
    philosophy: "A prime, boutique independent office building designed for businesses seeking a sophisticated setting that elevates their corporate presence and supports seamless day-to-day operations.",
    details: { ...emptyProjectDetails(), ...contact, headline: "Move-in-ready fully furnished office building", offering: "Lease | Independent building | Immediate availability", brochure: "/Aureum_Office Building.pdf", imageCaption: "Site photography",
      specifications: [
        { label: "Total built-up area", value: "14,000 sq ft", note: "" },
        { label: "Configuration", value: "G+1 standalone", note: "" },
        { label: "Floor plate (each floor)", value: "7,000 sq ft", note: "" },
        { label: "Location", value: "JAFZA (North)", note: "" },
      ], featuresTitle: "Key features", features: ["Fully furnished, ready to move in", "Executive cabins & meeting rooms", "Modern fit-out, quality interiors", "Plug & play setup", "Efficient floor plan", "Dedicated parking"], sections: [{ title: "Seamless connectivity", body: "Close proximity to Sheikh Zayed Road and Jebel Ali Port, with easy access to major logistics hubs." }],
    },
  },
].map((project) => ({ ...project,
  homepageHeadline: project.name,
  homepageSubline: project.location,
  homepageSpecs: project.details?.specifications.map((spec) => `${spec.label}: ${spec.value}`).join("\n") ?? "",
  homepageTagline: project.details?.headline ?? project.name,
  homepageTaglineSub: project.philosophy,
  homepageClosing: project.details?.offering ?? "",
}));
