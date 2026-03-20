import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAuthenticated } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  HeroSection,
  StatsSection,
  HowItWorksSection,
  PopularSubjectsSection,
  OtherSubjectsSection,
  FeatureHighlightsSection,
  CTASection,
} from "@/components/landing";

export function HomePage() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  usePageTitle(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  return (
    <main className="flex-1">
      <HeroSection />
      <StatsSection />
      <HowItWorksSection />
      <PopularSubjectsSection />
      <OtherSubjectsSection />
      <FeatureHighlightsSection />
      <CTASection />
    </main>
  );
}
