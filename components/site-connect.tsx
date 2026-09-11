"use client";

import { usePathname } from "next/navigation";
import { Connect } from "./ui";

const routeContent = {
  who: {
    title: "The next opportunity starts with a conversation.",
    copy: "Every significant development begins with a conversation about ambition, opportunity and long-term value. Whether exploring investment or expansion, Aureum welcomes discussions that begin with possibilities and evolve into enduring partnerships.",
  },
  pathways: {
    title: "The right conversation shapes the right outcome.",
    copy: "Meaningful partnerships begin with understanding the opportunity, not prescribing the solution. Every engagement starts by defining success before determining the path.",
  },
  portfolio: {
    title: "Tomorrow’s developments begin with today’s conversations.",
    copy: "Every future development starts with a shared ambition and the willingness to explore what is possible. Aureum welcomes conversations that lead to enduring partnerships and meaningful outcomes.",
  },
};

export function SiteConnect() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  const content = pathname.startsWith("/who-we-are")
    ? routeContent.who
    : pathname.startsWith("/how-we-partner")
      ? routeContent.pathways
      : pathname.startsWith("/portfolio")
        ? routeContent.portfolio
        : undefined;

  return <Connect compact title={content?.title} copy={content?.copy} />;
}
