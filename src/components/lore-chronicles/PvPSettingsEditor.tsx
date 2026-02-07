import { useState, useEffect } from "react";
import { Shield, Sword, Heart, AlertTriangle, MapPin, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PvPSettingsEditorProps {
  campaignId: string;
}

type LethalityMode = "no-kill" | "wound-only" | "permadeath";

interface PvPSettings {
  pvp_enabled: boolean;
  lethality_mode: LethalityMode;
  friendly_fire: boolean;
  require_consent: boolean;
  pvp_zones_only: boolean;
}

const LETHALITY_MODES: Array<{
  value: LethalityMode;
  label: string;
  description: string;
  icon: typeof Heart;
  color: string;
}> = [
  {
    value: "no-kill",
    label: "No Kill",
    description: "Players can only incapacitate, never kill",
    icon: Heart,
    color: "text-green-500",
  },
  {
    value: "wound-only",
    label: "Wound Only",
    description: "Injuries are possible but death requires consent",
    icon: Shield,
    color: "text-yellow-500",
  },
  {
    value: "permadeath",
    label: "Permadeath",
    description: "Defeated characters can die permanently",
    icon: AlertTriangle,
    color: "text-red-500",
  },
];

export const PvPSettingsEditor = ({ campaignId }: PvPSettingsEditorProps) => {
  const [settings, setSettings] = useState<PvPSettings>({
    pvp_enabled: false,
    lethality_mode: "wound-only",
    friendly_fire: false,
    require_consent: true,
    pvp_zones_only: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase
        .from("rp_pvp_settings")
        .select("*")
        .eq("campaign_id", campaignId)
        .maybeSingle();

      if (data) {
        setSettings({
          pvp_enabled: data.pvp_enabled,
          lethality_mode: data.lethality_mode as LethalityMode,
          friendly_fire: data.friendly_fire,
          require_consent: data.require_consent,
          pvp_zones_only: data.pvp_zones_only,
        });
        setHasExisting(true);
      }
      setLoading(false);
    };

    loadSettings();
  }, [campaignId]);

  const handleSave = async () => {
    setSaving(true);

    if (hasExisting) {
      const { error } = await supabase
        .from("rp_pvp_settings")
        .update(settings)
        .eq("campaign_id", campaignId);

      if (error) {
        toast({ title: "Failed to save settings", variant: "destructive" });
      } else {
        toast({ title: "PvP settings updated" });
      }
    } else {
      const { error } = await supabase.from("rp_pvp_settings").insert({
        campaign_id: campaignId,
        ...settings,
      });

      if (error) {
        toast({ title: "Failed to save settings", variant: "destructive" });
      } else {
        toast({ title: "PvP settings saved" });
        setHasExisting(true);
      }
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Loading PvP settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sword className="h-5 w-5 text-destructive" />
          Player vs Player Settings
        </CardTitle>
        <CardDescription>
          Configure how players can interact and compete with each other
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* PvP Enable Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Enable PvP</Label>
            <p className="text-sm text-muted-foreground">
              Allow players to physically interact and compete
            </p>
          </div>
          <Switch
            checked={settings.pvp_enabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, pvp_enabled: checked })
            }
          />
        </div>

        {settings.pvp_enabled && (
          <>
            {/* Lethality Mode */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Lethality Mode</Label>
              <RadioGroup
                value={settings.lethality_mode}
                onValueChange={(value) =>
                  setSettings({ ...settings, lethality_mode: value as LethalityMode })
                }
                className="grid gap-3"
              >
                {LETHALITY_MODES.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <div key={mode.value} className="relative">
                      <RadioGroupItem
                        value={mode.value}
                        id={mode.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={mode.value}
                        className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        <Icon className={`h-5 w-5 ${mode.color}`} />
                        <div className="flex-1">
                          <p className="font-medium">{mode.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {mode.description}
                          </p>
                        </div>
                        {settings.lethality_mode === mode.value && (
                          <Badge variant="default" className="shrink-0">
                            Selected
                          </Badge>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Additional Options */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Additional Rules</Label>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-0.5">
                  <Label>Friendly Fire</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow players in the same faction to attack each other
                  </p>
                </div>
                <Switch
                  checked={settings.friendly_fire}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, friendly_fire: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-0.5">
                  <Label>Require Consent</Label>
                  <p className="text-xs text-muted-foreground">
                    Target player must approve PvP engagement
                  </p>
                </div>
                <Switch
                  checked={settings.require_consent}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, require_consent: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    PvP Zones Only
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Restrict PvP to designated areas only
                  </p>
                </div>
                <Switch
                  checked={settings.pvp_zones_only}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, pvp_zones_only: checked })
                  }
                />
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save PvP Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};
