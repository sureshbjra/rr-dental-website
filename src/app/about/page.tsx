import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/sections/page-placeholder";

const title = "About the clinic";
const description = "Who we are, how we work, and why every plan starts with a scan.";

export const metadata: Metadata = { title, description };

export default function Page() {
  return <PagePlaceholder title={title} description={description} />;
}
