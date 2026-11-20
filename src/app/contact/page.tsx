import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/sections/page-placeholder";

const title = "Contact";
const description = "Call, email or visit the clinic — whichever is easiest for you.";

export const metadata: Metadata = { title, description };

export default function Page() {
  return <PagePlaceholder title={title} description={description} variant="contact" />;
}
