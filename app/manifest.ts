import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aureum — The 360° Industrial Developer",
    short_name: "Aureum",
    description:
      "Intelligence, strategy and disciplined execution for enduring industrial developments.",
    start_url: "/",
    display: "standalone",
    background_color: "#101a2b",
    theme_color: "#101a2b",
    icons: [
      {
        src: "/aureumLogo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
