import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/sections/page-placeholder";

const title = "Treatments";
const description = "Everything we offer, what's involved, and how long it takes.";

export const metadata: Metadata = { title, description };

export default function Page() {
  return <PagePlaceholder title={title} description={description} />;
}
