import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Auto-generate breadcrumbs from current route if no items provided
const routeLabels: Record<string, string> = {
  books: "Books",
  community: "Community",
  forum: "Forum",
  chronology: "Chronology",
  almanac: "Almanac",
  profile: "Profile",
  settings: "Settings",
  wishlist: "Wishlist",
  "my-books": "My Books",
  checkout: "Checkout",
  kingdoms: "Kingdoms",
  relics: "Relics",
  races: "Races",
  titles: "Titles",
  locations: "Locations",
  magic: "Magic",
  concepts: "Concepts",
  characters: "Characters",
};

export const Breadcrumbs = ({ items, className = "" }: BreadcrumbsProps) => {
  const location = useLocation();

  // Auto-generate from path if items not provided
  const breadcrumbs: BreadcrumbItem[] = items || (() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const crumbs: BreadcrumbItem[] = [];
    
    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      const label = routeLabels[segment] || decodeURIComponent(segment).replace(/-/g, " ");
      
      crumbs.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        href: isLast ? undefined : currentPath,
      });
    });
    
    return crumbs;
  })();

  if (breadcrumbs.length === 0) return null;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center gap-1 text-sm text-muted-foreground ${className}`}
    >
      <Link 
        to="/" 
        className="flex items-center gap-1 hover:text-primary transition-colors"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          {item.href ? (
            <Link 
              to={item.href} 
              className="hover:text-primary transition-colors capitalize"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium capitalize">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};
