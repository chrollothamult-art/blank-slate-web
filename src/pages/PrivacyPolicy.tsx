 import { Footer } from "@/components/Footer";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Separator } from "@/components/ui/separator";
 
 const PrivacyPolicy = () => {
   return (
     <div className="min-h-screen flex flex-col bg-background">
       <div className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
         <Card className="shadow-lg">
           <CardHeader className="text-center pb-2">
             <CardTitle className="text-4xl font-heading">Privacy Policy</CardTitle>
             <p className="text-sm text-muted-foreground mt-2">
               Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
             </p>
           </CardHeader>
           <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6 pt-6">
             <section>
               <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
               <p className="text-muted-foreground leading-relaxed">
                 Welcome to ThouArt. We respect your privacy and are committed to protecting your personal data. 
                 This privacy policy explains how we collect, use, and safeguard your information when you visit our website.
               </p>
             </section>
 
             <Separator />
 
             <section>
               <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
               <p className="text-muted-foreground leading-relaxed mb-3">
                 We may collect the following types of information:
               </p>
               <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                 <li><strong>Account Information:</strong> Email address, username, and profile details when you create an account.</li>
                 <li><strong>Usage Data:</strong> Information about how you interact with our site, including pages visited and features used.</li>
                 <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers.</li>
                 <li><strong>Cookies:</strong> We use cookies to enhance your experience and track reading preferences.</li>
               </ul>
             </section>
 
             <Separator />
 
             <section>
               <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
               <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                 <li>To provide and maintain our services</li>
                 <li>To personalize your reading experience</li>
                 <li>To send newsletters and updates (with your consent)</li>
                 <li>To improve our website and services</li>
                 <li>To detect and prevent fraud or abuse</li>
               </ul>
             </section>
 
             <Separator />
 
             <section>
               <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
               <p className="text-muted-foreground leading-relaxed">
                 We implement appropriate security measures to protect your personal information. 
                 However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
               </p>
             </section>
 
             <Separator />
 
             <section>
               <h2 className="text-xl font-semibold mb-3">5. Cookies and Tracking</h2>
               <p className="text-muted-foreground leading-relaxed">
                 We use cookies and similar tracking technologies to track activity on our website and store certain information. 
                 You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
               </p>
             </section>
 
             <Separator />
 
             <section>
               <h2 className="text-xl font-semibold mb-3">6. Third-Party Services</h2>
               <p className="text-muted-foreground leading-relaxed">
                 We may use third-party services for analytics, payment processing, and authentication. 
                 These services have their own privacy policies governing the use of your information.
               </p>
             </section>
 
             <Separator />
 
             <section>
               <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
               <p className="text-muted-foreground leading-relaxed mb-3">
                 Depending on your location, you may have the following rights:
               </p>
               <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                 <li>Access to your personal data</li>
                 <li>Correction of inaccurate data</li>
                 <li>Deletion of your data</li>
                 <li>Withdrawal of consent</li>
                 <li>Data portability</li>
               </ul>
             </section>
 
             <Separator />
 
             <section>
               <h2 className="text-xl font-semibold mb-3">8. Contact Us</h2>
               <p className="text-muted-foreground leading-relaxed">
                 If you have any questions about this Privacy Policy, please contact us at:{" "}
                 <a href="mailto:thouartdarkens@gmail.com" className="text-primary hover:underline">
                   thouartdarkens@gmail.com
                 </a>
               </p>
             </section>
           </CardContent>
         </Card>
       </div>
       <Footer />
     </div>
   );
 };
 
 export default PrivacyPolicy;