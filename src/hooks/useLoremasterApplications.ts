import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

// Store applications in rp_lore_proposals with category "loremaster_application"
export interface LoremasterApplication {
  id: string;
  user_id: string;
  motivation: string;
  experience: string;
  status: "pending" | "approved" | "rejected";
  reviewer_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  user?: {
    username: string;
    avatar_url: string | null;
  };
}

interface ApplicationContent {
  name: string;
  description: string;
  motivation: string;
  experience: string;
}

export const useLoremasterApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<LoremasterApplication[]>([]);
  const [myApplication, setMyApplication] = useState<LoremasterApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoremaster, setIsLoremaster] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is a Loremaster
  const checkStatus = useCallback(async () => {
    if (!user) {
      setIsLoremaster(false);
      setIsAdmin(false);
      return;
    }

    // Check loremaster status
    const { data: loremaster } = await supabase
      .from("rp_loremasters")
      .select("id")
      .eq("user_id", user.id)
      .single();

    setIsLoremaster(!!loremaster);

    // Check admin status via user_roles table
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    setIsAdmin(!!adminRole);
  }, [user]);

  // Fetch user's own application (stored as a lore proposal with special category)
  const fetchMyApplication = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("rp_lore_proposals")
      .select("*")
      .eq("user_id", user.id)
      .eq("category", "loremaster_application")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching my application:", error);
      return;
    }

    if (data) {
      const content = data.content as unknown as ApplicationContent;
      setMyApplication({
        id: data.id,
        user_id: data.user_id,
        motivation: content?.motivation || "",
        experience: content?.experience || "",
        status: data.status as "pending" | "approved" | "rejected",
        reviewer_notes: data.reviewer_notes,
        reviewed_at: data.reviewed_at,
        reviewed_by: data.reviewer_id,
        created_at: data.created_at
      });
    } else {
      setMyApplication(null);
    }
  }, [user]);

  // Fetch all pending applications (for admins)
  const fetchAllApplications = useCallback(async () => {
    const { data: apps, error } = await supabase
      .from("rp_lore_proposals")
      .select("*")
      .eq("category", "loremaster_application")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching applications:", error);
      return;
    }

    // Fetch user profiles
    const userIds = [...new Set((apps || []).map(a => a.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);

    const profilesMap = new Map(
      (profiles || []).map(p => [p.id, { username: p.username, avatar_url: p.avatar_url }])
    );

    const mapped: LoremasterApplication[] = (apps || []).map(a => {
      const content = a.content as unknown as ApplicationContent;
      return {
        id: a.id,
        user_id: a.user_id,
        motivation: content?.motivation || "",
        experience: content?.experience || "",
        status: a.status as "pending" | "approved" | "rejected",
        reviewer_notes: a.reviewer_notes,
        reviewed_at: a.reviewed_at,
        reviewed_by: a.reviewer_id,
        created_at: a.created_at,
        user: profilesMap.get(a.user_id)
      };
    });

    setApplications(mapped);
  }, []);

  // Submit a new application (as a lore proposal)
  const submitApplication = async (motivation: string, experience: string) => {
    if (!user) {
      toast({ title: "Please sign in to apply", variant: "destructive" });
      return false;
    }

    if (isLoremaster) {
      toast({ title: "You are already a Loremaster", variant: "destructive" });
      return false;
    }

    if (myApplication?.status === "pending") {
      toast({ title: "You already have a pending application", variant: "destructive" });
      return false;
    }

    const content: ApplicationContent = {
      name: "Loremaster Application",
      description: motivation.substring(0, 200),
      motivation,
      experience
    };

    const { error } = await supabase
      .from("rp_lore_proposals")
      .insert([{
        user_id: user.id,
        title: "Loremaster Application",
        category: "loremaster_application",
        content: JSON.parse(JSON.stringify(content)),
        status: "pending"
      }]);

    if (error) {
      toast({ title: "Failed to submit application", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ 
      title: "Application submitted!", 
      description: "An administrator will review your application." 
    });

    await fetchMyApplication();
    return true;
  };

  // Review an application (admin only)
  const reviewApplication = async (
    applicationId: string,
    status: "approved" | "rejected",
    notes?: string
  ) => {
    if (!user || !isAdmin) {
      toast({ title: "Unauthorized", variant: "destructive" });
      return false;
    }

    const application = applications.find(a => a.id === applicationId);
    if (!application) return false;

    // Update application status
    const { error: updateError } = await supabase
      .from("rp_lore_proposals")
      .update({
        status,
        reviewer_notes: notes || null,
        reviewed_at: new Date().toISOString(),
        reviewer_id: user.id
      })
      .eq("id", applicationId);

    if (updateError) {
      toast({ title: "Failed to review application", description: updateError.message, variant: "destructive" });
      return false;
    }

    // If approved, add to loremasters table
    if (status === "approved") {
      const { error: insertError } = await supabase
        .from("rp_loremasters")
        .insert({
          user_id: application.user_id,
          appointed_by: user.id
        });

      if (insertError) {
        console.error("Error adding loremaster:", insertError);
        // Don't fail - application is already updated
      }
    }

    toast({ 
      title: status === "approved" ? "Application approved!" : "Application rejected",
      description: status === "approved" 
        ? "The user has been granted Loremaster status." 
        : "The applicant will be notified."
    });

    await fetchAllApplications();
    return true;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await checkStatus();
      await fetchMyApplication();
      setLoading(false);
    };

    loadData();
  }, [checkStatus, fetchMyApplication]);

  // Fetch all applications if admin
  useEffect(() => {
    if (isAdmin) {
      fetchAllApplications();
    }
  }, [isAdmin, fetchAllApplications]);

  return {
    applications,
    myApplication,
    loading,
    isLoremaster,
    isAdmin,
    submitApplication,
    reviewApplication,
    refetch: fetchAllApplications
  };
};
