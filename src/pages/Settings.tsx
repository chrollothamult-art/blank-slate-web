import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { StreakCard } from "@/components/StreakCard";
import { AchievementsDisplay } from "@/components/AchievementsDisplay";
import { ActivityFeed } from "@/components/ActivityFeed";
import { SuggestedUsers } from "@/components/SuggestedUsers";
import { AvatarUpload } from "@/components/AvatarUpload";

export const Settings = () => {
  const { user, profile, loading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  // Determine initial tab from hash
  const getInitialTab = () => {
    const hash = location.hash.replace('#', '');
    if (hash === 'achievements') return 'achievements';
    if (hash === 'social') return 'social';
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Update tab when hash changes
    const hash = location.hash.replace('#', '');
    if (hash === 'achievements') {
      setActiveTab('achievements');
    } else if (hash === 'social') {
      setActiveTab('social');
    }
  }, [location.hash]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setFullName(profile.full_name || "");
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await updateProfile({
      username,
      full_name: fullName,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-heading">Profile Picture</CardTitle>
                  <CardDescription>Upload a photo to personalize your profile</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <AvatarUpload />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-heading">Account Settings</CardTitle>
                  <CardDescription>Update your profile information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>

                    <Button type="submit" disabled={saving} className="w-full">
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <StreakCard />
                <Card>
                  <CardHeader>
                    <CardTitle>Reading Stats</CardTitle>
                    <CardDescription>Your reading journey at a glance</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>Start reading to build your streak and earn achievements!</p>
                  </CardContent>
                </Card>
              </div>
              <AchievementsDisplay showLocked />
            </TabsContent>

            <TabsContent value="social" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <SuggestedUsers />
                <ActivityFeed />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};