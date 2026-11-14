import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Where Should I Eat? USC",
    short_name: "Where to Eat",
    description: "Which USC dining hall has food you can eat today",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#990000",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
