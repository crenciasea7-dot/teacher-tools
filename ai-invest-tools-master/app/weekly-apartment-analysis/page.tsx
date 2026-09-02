import { redirect } from "next/navigation";

const WEEKLY_APARTMENT_GRAPH_URL =
  "https://rone-weekly-capital-dashboard.vercel.app/";

export default function WeeklyApartmentGraphRedirect() {
  redirect(WEEKLY_APARTMENT_GRAPH_URL);
}
