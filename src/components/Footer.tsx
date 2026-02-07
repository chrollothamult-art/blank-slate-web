import { Mail } from "lucide-react";
import { FaTwitter, FaTelegram } from "react-icons/fa";
import { NewsletterForm } from "./NewsletterForm";
import { Link } from "react-router-dom";
import { almanacCategories } from "@/data/chronologyData";
import thouartLogo from "@/assets/thouart-logo.png";

export const Footer = () => {
  const quickLinks = [
    { name: "Books", href: "/books" },
    { name: "Community", href: "/community" },
    { name: "Wishlist", href: "/wishlist" },
  ];

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={thouartLogo} alt="ThouArt" className="h-10 w-10" />
              <span className="text-xl font-playfair font-bold text-primary">ThouArt</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Your gateway to immersive fantasy worlds, rich lore, and a passionate reading community.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://x.com/Thouartdarkens"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                aria-label="Twitter"
              >
                <FaTwitter className="h-4 w-4" />
              </a>
              <a
                href="https://t.me/Thouartframer"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                aria-label="Telegram"
              >
                <FaTelegram className="h-4 w-4" />
              </a>
              <a
                href="mailto:thouartdarkens@gmail.com"
                className="p-2.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Explore</h4>
            <nav className="flex flex-col gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Almanac Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Almanac</h4>
            <nav className="flex flex-col gap-3">
              {almanacCategories.slice(0, 4).map((category) => (
                <Link
                  key={category.id}
                  to={`/almanac/${category.id}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {category.title}
                </Link>
              ))}
            </nav>
          </div>

          {/* More Almanac + Newsletter */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">More Lore</h4>
            <nav className="flex flex-col gap-3 mb-8">
              {almanacCategories.slice(4).map((category) => (
                <Link
                  key={category.id}
                  to={`/almanac/${category.id}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {category.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="max-w-md mx-auto text-center">
            <h4 className="text-lg font-semibold mb-2">Stay in the Loop</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Get notified about new books, lore updates, and community events.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ThouArt. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
