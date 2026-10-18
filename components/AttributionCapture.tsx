"use client";

import { useEffect } from "react";
import { getAttribution } from "@/lib/attribution";

// Runs once per page load so the first page of a visit is remembered even if the form is on another page.
export default function AttributionCapture() {
  useEffect(() => {
    getAttribution();
  }, []);
  return null;
}
