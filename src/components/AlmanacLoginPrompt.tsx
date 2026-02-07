 import { useNavigate } from "react-router-dom";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { BookOpen, Sparkles, Users } from "lucide-react";
 import thouartLogo from "@/assets/thouart-logo.png";
 
 interface AlmanacLoginPromptProps {
   open: boolean;
   onClose: () => void;
 }
 
 export const AlmanacLoginPrompt = ({ open, onClose }: AlmanacLoginPromptProps) => {
   const navigate = useNavigate();
 
   const handleLogin = () => {
     onClose();
     navigate("/auth");
   };
 
   return (
     <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader className="text-center">
           <div className="flex justify-center mb-4">
             <img src={thouartLogo} alt="ThouArt" className="h-16 w-16" />
           </div>
           <DialogTitle className="text-2xl font-heading text-center">
             Unlock the Full Almanac
           </DialogTitle>
           <DialogDescription className="text-center pt-2">
             You've explored 3 entries! Create a free account to continue your journey through the lore.
           </DialogDescription>
         </DialogHeader>
 
         <div className="grid gap-4 py-4">
           <div className="flex items-center gap-3 text-sm text-muted-foreground">
             <div className="p-2 rounded-lg bg-primary/10">
               <BookOpen className="h-4 w-4 text-primary" />
             </div>
             <span>Unlimited access to all almanac entries</span>
           </div>
           <div className="flex items-center gap-3 text-sm text-muted-foreground">
             <div className="p-2 rounded-lg bg-primary/10">
               <Sparkles className="h-4 w-4 text-primary" />
             </div>
             <span>Track your reading progress</span>
           </div>
           <div className="flex items-center gap-3 text-sm text-muted-foreground">
             <div className="p-2 rounded-lg bg-primary/10">
               <Users className="h-4 w-4 text-primary" />
             </div>
             <span>Join the community discussions</span>
           </div>
         </div>
 
         <DialogFooter className="flex-col gap-2 sm:flex-col">
           <Button onClick={handleLogin} className="w-full">
             Sign In / Create Account
           </Button>
           <Button variant="ghost" onClick={onClose} className="w-full">
             Maybe Later
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 };