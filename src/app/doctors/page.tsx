import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/sections/page-placeholder";

const title = "Our dentists";
const description = "The people who will look after you, and what each of them specialises in.";

export const metadata: Metadata = { title, description };

export default function Page() {
  return <PagePlaceholder title={title} description={description} />;
}
