import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { StreakCard } from "@/components/StreakCard";
import { AchievementsDisplay } from "@/components/AchievementsDisplay";
import { ActivityFeed } from "@/components/ActivityFeed";
import { SuggestedUsers } from "@/components/SuggestedUsers";
import { AvatarUpload } from "@/components/AvatarUpload";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, Scroll, MessageSquare, Heart, Users, BellRing, BellOff } from "lucide-react";

export const Settings = () => {
  const { user, profile, loading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { 
    preferences, 
    loading: prefsLoading, 
    updatePreferences,
    infiniteScrollEnabled,
    notificationsComments,
    notificationsLikes,
    notificationsFollows,
  } = useUserPreferences();
  
  const {
    isSupported: pushSupported,
    isSubscribed: pushEnabled,
    permission: pushPermission,
    requestPermission,
    disableNotifications,
  } = usePushNotifications();
  
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  // Determine initial tab from hash
  const getInitialTab = () => {
    const hash = location.hash.replace('#', '');
    if (hash === 'achievements') return 'achievements';
    if (hash === 'social') return 'social';
    if (hash === 'preferences') return 'preferences';
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
    } else if (hash === 'preferences') {
      setActiveTab('preferences');
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

  const handlePreferenceChange = async (key: string, value: boolean) => {
    const success = await updatePreferences({ [key]: value });
    if (success) {
      toast({
        title: "Preference updated",
        description: "Your settings have been saved.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update preference",
        variant: "destructive",
      });
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermission();
      if (granted) {
        toast({
          title: "Push notifications enabled",
          description: "You'll now receive browser notifications for activity.",
        });
      } else {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    } else {
      disableNotifications();
      toast({
        title: "Push notifications disabled",
        description: "You won't receive browser notifications anymore.",
      });
    }
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
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

            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-heading flex items-center gap-2">
                    <Scroll className="h-5 w-5" />
                    Display Settings
                  </CardTitle>
                  <CardDescription>Customize how content is displayed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="infinite-scroll" className="text-base">Infinite Scroll</Label>
                      <p className="text-sm text-muted-foreground">
                        Load more content automatically as you scroll on almanac pages
                      </p>
                    </div>
                    <Switch
                      id="infinite-scroll"
                      checked={infiniteScrollEnabled}
                      onCheckedChange={(checked) => handlePreferenceChange('infinite_scroll_enabled', checked)}
                      disabled={prefsLoading}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-heading flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>Control which notifications you receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Push Notifications Toggle */}
                  {pushSupported && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5 flex items-start gap-3">
                          {pushEnabled ? (
                            <BellRing className="h-5 w-5 mt-0.5 text-primary" />
                          ) : (
                            <BellOff className="h-5 w-5 mt-0.5 text-muted-foreground" />
                          )}
                          <div>
                            <Label htmlFor="push-notifications" className="text-base">Browser Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive notifications even when the tab is in the background
                            </p>
                            {pushPermission === 'denied' && (
                              <p className="text-xs text-destructive mt-1">
                                Notifications blocked. Please enable them in your browser settings.
                              </p>
                            )}
                          </div>
                        </div>
                        <Switch
                          id="push-notifications"
                          checked={pushEnabled}
                          onCheckedChange={handlePushToggle}
                          disabled={pushPermission === 'denied'}
                        />
                      </div>
                      <Separator />
                    </>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="notif-comments" className="text-base">Comments & Replies</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when someone comments on your content
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="notif-comments"
                      checked={notificationsComments}
                      onCheckedChange={(checked) => handlePreferenceChange('notifications_comments', checked)}
                      disabled={prefsLoading}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex items-start gap-3">
                      <Heart className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="notif-likes" className="text-base">Likes</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when someone likes your content
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="notif-likes"
                      checked={notificationsLikes}
                      onCheckedChange={(checked) => handlePreferenceChange('notifications_likes', checked)}
                      disabled={prefsLoading}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex items-start gap-3">
                      <Users className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="notif-follows" className="text-base">New Followers</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when someone follows you
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="notif-follows"
                      checked={notificationsFollows}
                      onCheckedChange={(checked) => handlePreferenceChange('notifications_follows', checked)}
                      disabled={prefsLoading}
                    />
                  </div>
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
