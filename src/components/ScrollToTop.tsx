import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component that scrolls the window to the top
 * whenever the route changes.
 */
export const ScrollToTop = () => {
  const location = useLocation();

  // Use useEffect with multiple delayed scroll attempts to ensure scroll happens
  // after framer-motion page transitions complete
  useEffect(() => {
    const scroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    // Immediate scroll
    scroll();
    
    // Schedule multiple scroll attempts to catch after framer-motion animations
    const timeouts = [0, 50, 100, 200].map(delay => 
      setTimeout(scroll, delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [location.pathname, location.search]);

  return null;
};
