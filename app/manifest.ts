import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Middleman",
    short_name: "Middleman",
    description: "A safer Nigerian marketplace for digital products and services.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3ec",
    theme_color: "#f26419",
    icons: [
      {
        src: "/brand/app-icon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
