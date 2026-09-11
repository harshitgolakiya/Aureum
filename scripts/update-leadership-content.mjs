import mysql from "mysql2/promise";

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const profiles = {
  "leader.akhilesh": {
    name: "Akhilesh Padinhare",
    role: "Founder and Executive Director",
    discipline: "Investment & Strategy",
    visualLabel: "Invest",
    portrait: "leadership-portrait-02.webp",
    profilePortrait: "leadership-profile-portrait-02.webp",
    biographyOne:
      "Akhilesh Padinhare is the Founder and Executive Director of Aureum, leading the firm’s investment strategy and growth across industrial and logistics real estate.",
    biographyTwo:
      "With more than 26 years of experience in the UAE, Akhilesh combines a Civil Engineering background with deep expertise in industrial development, investment evaluation, construction and asset execution. His experience spans the full real estate investment and development lifecycle, enabling him to assess opportunities from both an investment and execution perspective.",
    biographyThree:
      "At Aureum, he focuses on investment origination, development strategy, capital structuring, strategic partnerships and value creation, with particular expertise in industrial, logistics, manufacturing and Built-to-Suit assets.",
    biographyFour:
      "His investment philosophy is centred on disciplined underwriting, downside protection, execution certainty and long-term asset value. He works closely with institutional investors, family offices, occupiers and strategic partners to transform industrial real estate opportunities into scalable, income-generating assets.",
    biographyFive:
      "Akhilesh is instrumental in shaping Aureum’s evolution into an integrated industrial real estate investment and development platform, with ambitions to build a diversified portfolio of institutional-quality assets across the UAE and the wider GCC.",
  },
  "leader.tejeshree": {
    name: "Tejeshree Jadhav",
    role: "Associate Director – Industrial Assets",
    discipline: "Business Development & Leasing",
    visualLabel: "Assets",
    portrait: "leadership-portrait-tejeshree.webp",
    profilePortrait: "leadership-profile-portrait-tejeshree.webp",
    biographyOne:
      "Tejeshree Jadhav leads business development and leasing initiatives at Aureum, with a focus on occupier relationships, commercialisation and portfolio growth across industrial and logistics real estate.",
    biographyTwo:
      "She drives leasing strategy, tenant origination, market engagement, and commercial negotiations, working closely with investors, occupiers, and Aureum’s development teams to create strong alignment between industrial assets and market demand.",
    biographyThree:
      "Her focus is on building long-term relationships with leading industrial, logistics and manufacturing occupiers, identifying opportunities, and converting market relationships into sustainable leasing outcomes.",
    biographyFour:
      "As Aureum expands its portfolio across the UAE, Tejeshree plays an important role in growing the occupier network, strengthening recurring income, and supporting long-term asset value creation.",
    biographyFive: "",
  },
};

const database = mysql.createPool({
  uri: connectionString,
  connectionLimit: 1,
  charset: "utf8mb4",
  timezone: "Z",
});

try {
  for (const [key, profile] of Object.entries(profiles)) {
    await database.execute(
      `INSERT INTO cms_entries (content_key, value_json)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), updated_at = CURRENT_TIMESTAMP`,
      [key, JSON.stringify(profile)],
    );
  }
  console.log("Updated Akhilesh and Tejeshree leadership content.");
} finally {
  await database.end();
}
