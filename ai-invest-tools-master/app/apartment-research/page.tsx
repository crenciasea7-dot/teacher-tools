import { redirect } from "next/navigation";

const APARTMENT_RESEARCH_URL =
  "https://jipjung-apartment-research.crenciasea7.chatgpt.site/";

export default function ApartmentResearchRedirect() {
  redirect(APARTMENT_RESEARCH_URL);
}
