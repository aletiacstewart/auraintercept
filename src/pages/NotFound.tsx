import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SEO } from "@/components/seo/SEO";
import { supabase } from "@/integrations/supabase/client";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    // Fire-and-forget log to platform_issues so we can see where broken inbound
    // links point. Failure is non-blocking (RLS or unauth users may not insert).
    void supabase
      .from("platform_issues")
      .insert({
        issue_type: "not_found",
        severity: "low",
        title: `404: ${location.pathname}`,
        description: `Bad route hit — referrer: ${document.referrer || "(direct)"}, ua: ${navigator.userAgent}`,
      })
      .then(({ error }) => {
        if (error) console.warn("404 log failed:", error.message);
      });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <SEO
        title="Page Not Found | Aura Intercept"
        description="The page you're looking for doesn't exist. Return to Aura Intercept home."
        path={location.pathname}
        noindex
      />
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-foreground/70">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
