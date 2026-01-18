import { Mail } from "lucide-react";
import { FaTwitter, FaTelegram } from "react-icons/fa";
import { NewsletterForm } from "./NewsletterForm";
import SocialButton from "./ui/social-button";

export const Footer = () => {
  return (
    <footer className="bg-muted/20 border-t border-border/50">
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="flex flex-col items-center gap-6 sm:gap-8">
          {/* Newsletter Subscription */}
          <div className="text-center space-y-2 w-full max-w-md">
            <h3 className="text-base sm:text-lg font-semibold">Stay Updated</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Subscribe to get notified about new books
            </p>
            <NewsletterForm />
          </div>

          {/* Share & Social Links */}
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <SocialButton 
              shareTitle="Discover amazing books at ThouArt!"
              shareDescription="Professional online bookstore featuring curated books and community discussions."
            />
            
            <div className="flex items-center gap-3 sm:gap-4">
              <a
                href="https://x.com/Thouartdarkens"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 sm:p-3 rounded-xl bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                aria-label="Twitter"
              >
                <FaTwitter className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a
                href="https://t.me/Thouartframer"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 sm:p-3 rounded-xl bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                aria-label="Telegram"
              >
                <FaTelegram className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a
                href="mailto:thouartdarkens@gmail.com"
                className="p-2.5 sm:p-3 rounded-xl bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                aria-label="Email"
              >
                <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} ThouArt. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
