 import React, { Component, ErrorInfo, ReactNode } from 'react';
 import { AlertTriangle, RefreshCw } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent } from '@/components/ui/card';
 
 interface Props {
   children: ReactNode;
   fallback?: ReactNode;
   onError?: (error: Error, errorInfo: ErrorInfo) => void;
 }
 
 interface State {
   hasError: boolean;
   error: Error | null;
 }
 
 export class ErrorBoundary extends Component<Props, State> {
   constructor(props: Props) {
     super(props);
     this.state = { hasError: false, error: null };
   }
 
   static getDerivedStateFromError(error: Error): State {
     return { hasError: true, error };
   }
 
   componentDidCatch(error: Error, errorInfo: ErrorInfo) {
     console.error('ErrorBoundary caught an error:', error, errorInfo);
     this.props.onError?.(error, errorInfo);
   }
 
   handleRetry = () => {
     this.setState({ hasError: false, error: null });
   };
 
   render() {
     if (this.state.hasError) {
       if (this.props.fallback) {
         return this.props.fallback;
       }
 
       return (
         <Card className="m-4 border-destructive/50 bg-destructive/5">
           <CardContent className="flex flex-col items-center justify-center py-12 text-center">
             <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
             <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
             <p className="text-muted-foreground mb-4 max-w-md">
               We encountered an unexpected error. Please try again or refresh the page.
             </p>
             <div className="flex gap-3">
               <Button variant="outline" onClick={this.handleRetry}>
                 <RefreshCw className="h-4 w-4 mr-2" />
                 Try Again
               </Button>
               <Button variant="default" onClick={() => window.location.reload()}>
                 Refresh Page
               </Button>
             </div>
             {process.env.NODE_ENV === 'development' && this.state.error && (
               <pre className="mt-6 p-4 bg-muted rounded-lg text-left text-xs overflow-auto max-w-full">
                 {this.state.error.message}
               </pre>
             )}
           </CardContent>
         </Card>
       );
     }
 
     return this.props.children;
   }
 }
 
 // Minimal fallback for critical sections
 export const MinimalErrorFallback = () => (
   <div className="flex items-center justify-center p-8 text-muted-foreground">
     <AlertTriangle className="h-5 w-5 mr-2" />
     <span>Failed to load this section</span>
   </div>
 );
 
 export default ErrorBoundary;