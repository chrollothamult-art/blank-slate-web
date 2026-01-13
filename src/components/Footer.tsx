import { Mail } from "lucide-react";
import { FaTwitter, FaTelegram } from "react-icons/fa";
import { NewsletterForm } from "./NewsletterForm";

export const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-6">
          {/* Newsletter Subscription */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">
              Subscribe to get notified about new books and updates
            </p>
            <NewsletterForm />
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://x.com/Thouartdarkens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Twitter"
            >
              <FaTwitter className="h-5 w-5" />
            </a>
            <a
              href="https://t.me/Thouartframer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Telegram"
            >
              <FaTelegram className="h-5 w-5" />
            </a>
            <a
              href="mailto:thouartdarkens@gmail.com"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} ThouArt. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
