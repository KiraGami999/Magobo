"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OwnProfile, PublicCategory } from "@magobo/shared";
import { updateUserProfileSchema } from "@magobo/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/magobo/form-field";
import { LoadingState } from "@/components/magobo/loading-state";
import { ErrorState } from "@/components/magobo/error-state";
import { VerificationBadge } from "@/components/magobo/verification-badge";
import { apiGet, apiPost } from "@/lib/api-client";
import { useCurrentUser } from "@/lib/use-current-user";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useCurrentUser();
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [skills, setSkills] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [profileRes, categoriesRes] = await Promise.all([
      apiGet<{ profile: OwnProfile }>("/api/profile/me"),
      apiGet<{ categories: PublicCategory[] }>("/api/categories"),
    ]);

    if (!profileRes.success) {
      setError(profileRes.error.message);
      setLoading(false);
      return;
    }

    setProfile(profileRes.data.profile);
    setBio(profileRes.data.profile.userProfile?.bio ?? "");
    setCity(profileRes.data.profile.userProfile?.location.city ?? "");
    setSkills(profileRes.data.profile.userProfile?.skills.join(", ") ?? "");
    if (categoriesRes.success) setCategories(categoriesRes.data.categories);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load();
    }
  }, [authLoading, user, router, load]);

  async function enableProvider() {
    const response = await apiPost("/api/profile/me/roles", { role: "SERVICE_PROVIDER" });
    if (!response.success) {
      toast.error(response.error.message);
      return;
    }
    toast.success("Service provider capability enabled.");
    await load();
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    const parsed = updateUserProfileSchema.safeParse({
      bio,
      location: { city: city || undefined },
      skills: skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }

    setSaving(true);
    const response = await fetch("/api/profile/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const body = (await response.json()) as { success: boolean; error?: { message: string } };
    setSaving(false);

    if (!body.success) {
      toast.error(body.error?.message ?? "Could not save profile.");
      return;
    }

    toast.success("Profile saved.");
    await load();
  }

  if (authLoading || loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={load} />;
  if (!profile) return null;

  const kycVerified = profile.kycStatus === "VERIFIED";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
          <p className="text-muted-foreground text-sm">Manage how others see you on Magobo.</p>
        </div>
        <VerificationBadge state={kycVerified ? "verified" : profile.kycStatus === "PENDING" || profile.kycStatus === "UNDER_REVIEW" ? "pending" : "unverified"} showLabel />
      </div>

      {!profile.userProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Offer services on Magobo</CardTitle>
            <CardDescription>Enable a service provider profile to submit proposals and get hired.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={enableProvider}>Enable service provider</Button>
          </CardContent>
        </Card>
      )}

      {profile.userProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Provider profile</CardTitle>
            <CardDescription>Bio, location, and skills shown on your public profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSave}>
              <FormField id="bio" label="Bio">
                <Input id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
              </FormField>
              <FormField id="city" label="City">
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
              </FormField>
              <FormField id="skills" label="Skills (comma-separated)">
                <Input id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} />
              </FormField>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identity verification (KYC)</CardTitle>
          <CardDescription>
            Verify your identity to build trust. Status: <strong>{profile.kycStatus.replaceAll("_", " ")}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/profile/kyc" className={buttonVariants({ variant: "outline" })}>
            Manage verification
          </Link>
        </CardContent>
      </Card>

      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available categories</CardTitle>
            <CardDescription>Service categories you can add to your profile in a future update.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {categories.flatMap((parent) => parent.children ?? []).slice(0, 8).map((cat) => (
              <span key={cat.id} className="bg-muted rounded-full px-3 py-1 text-xs">
                {cat.name}
              </span>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
