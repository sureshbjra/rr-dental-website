import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/sections/page-placeholder";

const title = "Book a consultation";
const description = "Choose a time that suits you. Your first visit includes a 3D scan and a written plan.";

export const metadata: Metadata = { title, description };

export default function Page() {
  return <PagePlaceholder title={title} description={description} variant="booking" />;
}
