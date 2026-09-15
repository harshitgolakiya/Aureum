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
        src: "/AUREUM%2032%20X%2032.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
  };
}
