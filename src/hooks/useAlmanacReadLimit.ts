 import { useState, useEffect, useCallback } from "react";
 import { useAuth } from "@/contexts/AuthContext";
 
 const STORAGE_KEY = "thouart_almanac_reads";
 const MAX_FREE_READS = 3;
 
 interface AlmanacReadData {
   entries: string[];
   lastReset: number;
 }
 
 export const useAlmanacReadLimit = () => {
   const { user } = useAuth();
   const [showLoginPrompt, setShowLoginPrompt] = useState(false);
   const [readCount, setReadCount] = useState(0);
 
   // Get stored read data
   const getStoredData = useCallback((): AlmanacReadData => {
     try {
       const stored = localStorage.getItem(STORAGE_KEY);
       if (stored) {
         const data = JSON.parse(stored) as AlmanacReadData;
         // Reset if it's been more than 24 hours
         const dayInMs = 24 * 60 * 60 * 1000;
         if (Date.now() - data.lastReset > dayInMs) {
           return { entries: [], lastReset: Date.now() };
         }
         return data;
       }
     } catch {
       // Ignore parse errors
     }
     return { entries: [], lastReset: Date.now() };
   }, []);
 
   // Save read data
   const saveStoredData = useCallback((data: AlmanacReadData) => {
     try {
       localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
     } catch {
       // Ignore storage errors
     }
   }, []);
 
   // Initialize read count
   useEffect(() => {
     if (!user) {
       const data = getStoredData();
       setReadCount(data.entries.length);
     }
   }, [user, getStoredData]);
 
   // Check if user can read an entry
   const canReadEntry = useCallback((entryId: string): boolean => {
     // Logged in users have unlimited access
     if (user) return true;
 
     const data = getStoredData();
     
     // If entry was already read, allow re-reading
     if (data.entries.includes(entryId)) return true;
 
     // Check if limit reached
     if (data.entries.length >= MAX_FREE_READS) {
       setShowLoginPrompt(true);
       return false;
     }
 
     return true;
   }, [user, getStoredData]);
 
   // Record that an entry was read
   const recordEntryRead = useCallback((entryId: string) => {
     if (user) return; // Don't track for logged in users
 
     const data = getStoredData();
     
     // Don't record duplicates
     if (!data.entries.includes(entryId)) {
       data.entries.push(entryId);
       saveStoredData(data);
       setReadCount(data.entries.length);
     }
   }, [user, getStoredData, saveStoredData]);
 
   // Close login prompt
   const closeLoginPrompt = useCallback(() => {
     setShowLoginPrompt(false);
   }, []);
 
   return {
     canReadEntry,
     recordEntryRead,
     showLoginPrompt,
     closeLoginPrompt,
     readCount,
     maxFreeReads: MAX_FREE_READS,
     isLoggedIn: !!user,
   };
 };