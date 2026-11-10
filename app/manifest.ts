import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Middleman",
    short_name: "Middleman",
    description: "Browse digital products from independent creators. Purchases are paused.",
    start_url: "/marketplace",
    display: "standalone",
    background_color: "#f7f3ec",
    theme_color: "#f7f3ec",
    icons: [
      {
        src: "/brand/app-icon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
