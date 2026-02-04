"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";
import MediationChatBot from "@/components/dispute/MediationChatBot";
import PresenceVerification from "@/components/dispute/PresenceVerification";
import MediationChatRoom from "@/components/dispute/MediationChatRoom";
import { Loader2 } from "lucide-react";

type MediationStep = "loading" | "rules" | "presence" | "chat";

export default function MediationPage() {
  const { t } = useSafeLanguage();
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const disputeId = params.id as string;

  const [step, setStep] = useState<MediationStep>("loading");
  const [dispute, setDispute] = useState<any>(null);
  const [userRole, setUserRole] = useState<"client" | "provider" | "admin">("client");
  const [authUid, setAuthUid] = useState<string>("");
  const [resolvedUserName, setResolvedUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      loadDisputeData();
    }
  }, [user, authLoading]);

  const loadDisputeData = async () => {
    try {
      const response = await fetch(`/api/disputes/${disputeId}/info`);
      const data = await response.json();

      if (data.success) {
        setDispute(data.dispute);
        
        // Determine user role and verify identity
        // We try to fetch the profile using the current user ID (which could be the internal 'id' or the Auth 'user_id')
        const { data: profile, error: profileError } = await (await import("@/lib/supabase/client"))
          .createClient()
          .from("profiles")
          .select("id, role, user_id, first_name")
          .or(`user_id.eq.${user!.id},id.eq.${user!.id}`)
          .single();

        if (profileError || !profile) {
          console.error("❌ Profile not found for user:", user!.id);
          alert(t('mediation.profileNotFound', { id: user!.id }));
          router.push("/");
          return;
        }

        const realAuthUid = profile.user_id; // This is the real Auth UID
        setAuthUid(realAuthUid);
        setResolvedUserName(profile.first_name || (user as any).user_metadata?.first_name || t('mediation.none'));

        console.log("🔍 Mediation Auth Check:", {
          role: profile.role,
          authUid: realAuthUid,
          profileId: profile.id,
          orderClientId: data.dispute.order.client_id,
          orderProviderId: data.dispute.order.provider_id
        });

        // Resolve Provider ID locally for extra verification
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data: providerInfo } = await supabase
          .from("providers")
          .select("id")
          .eq("profile_id", profile.id)
          .single();
        
        const currentProviderId = providerInfo?.id;

        // 1. Robust ADMIN Check
        if (profile.role && String(profile.role).toLowerCase() === "admin") {
          console.log("✅ Admin access granted");
          setUserRole("admin");
          if (data.dispute.session_status === 'active') {
             setStep("chat");
          } else {
             setStep("presence");
          }
          return; // Strictly stop here for admins
        } 

        // 2. CLIENT Check (using Auth UID)
        if (data.dispute.order.client_id === realAuthUid) {
          console.log("✅ Client access granted");
          setUserRole("client");
          if (data.dispute.session_status === 'active') {
            setStep("chat");
          } else if (data.dispute.client_accepted_rules) {
            setStep("presence");
          } else {
            setStep("rules");
          }
          return;
        } 

        // 3. PROVIDER Check (using Provider ID or Auth UID)
        if (
          data.dispute.order.provider_id === currentProviderId || 
          data.dispute.order.provider?.user_id === realAuthUid
        ) {
          console.log("✅ Provider access granted");
          setUserRole("provider");
          if (data.dispute.session_status === 'active') {
            setStep("chat");
          } else if (data.dispute.provider_accepted_rules) {
            setStep("presence");
          } else {
            setStep("rules");
          }
          return;
        }

        // 4. FALLBACK - Not Authorized
        console.error("❌ Authorization failed:", {
          userId: user!.id,
          authUid: realAuthUid,
          currentProviderId,
          orderClientId: data.dispute.order.client_id,
          orderProviderId: data.dispute.order.provider_id,
          role: profile.role
        });
        alert(`${t('mediation.errors.authFailed')}
 
${t('mediation.errors.details')}
- ${t('mediation.authId')}: ${realAuthUid}
- Role: ${profile.role}
- ${t('mediation.clientInOrder')}: ${data.dispute.order.client_id}
- ${t('mediation.providerInOrder')}: ${data.dispute.order.provider_id}`);
        router.push("/");
        return;

        // 6a. Fix missing Provider User ID if necessary
        const disputeData = { ...data.dispute };
        if (disputeData.order && !disputeData.order.provider && disputeData.order.provider_id) {
            console.warn("⚠️ Provider profile missing in dispute data, fetching locally...");
            const supabase = (await import("@/lib/supabase/client")).createClient();
            const { data: pData } = await supabase
                .from("providers")
                .select("profile_id, profiles(user_id, first_name, last_name)")
                .eq("id", disputeData.order.provider_id)
                .single();
            
            if (pData && pData.profiles) {
                console.log("✅ Recovered Provider User ID:", pData.profiles.user_id);
                // Manually reconstruct the provider object
                disputeData.order.provider = {
                    user_id: pData.profiles.user_id,
                    first_name: pData.profiles.first_name,
                    last_name: pData.profiles.last_name,
                };
            }
        }

        setDispute(disputeData);
      } else {
        alert(t('mediation.disputeNotFound'));
        router.push("/");
      }
    } catch (error) {
      console.error("Error loading dispute:", error);
      alert(t('mediation.loadError'));
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRules = async () => {
    try {
      // Update dispute to mark rules as accepted
      const field = userRole === "client" ? "client_accepted_rules" : "provider_accepted_rules";
      
      await fetch(`/api/disputes/${disputeId}/accept-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: userRole })
      });

      setStep("presence");
    } catch (error) {
      console.error("Error accepting rules:", error);
    }
  };

  const handleRejectRules = () => {
    if (confirm(t('mediation.confirmExit'))) {
      router.back();
    }
  };

  const handleBothPresent = () => {
    setStep("chat");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700">{t('mediation.loadingMediation')}</p>
        </div>
      </div>
    );
  }

  if (!dispute || !user) {
    return null;
  }

  return (
    <>
      {step === "rules" && (
        <MediationChatBot
          disputeReason={dispute.reason}
          disputeDetails={dispute.details}
          userRole={userRole}
          userName={resolvedUserName}
          onAccept={handleAcceptRules}
          onReject={handleRejectRules}
        />
      )}

      {step === "presence" && (
        <PresenceVerification
           disputeId={disputeId}
          currentUserId={authUid}
          currentUserRole={userRole}
          clientName={dispute.order.client ? `${dispute.order.client.first_name} ${dispute.order.client.last_name}` : t('mediation.unknownClient')}
          providerName={dispute.order.provider ? `${dispute.order.provider.first_name} ${dispute.order.provider.last_name}` : t('mediation.unknownProvider')}
          onBothPresent={handleBothPresent}
        />
      )}

      {step === "chat" && (
        <MediationChatRoom
          disputeId={disputeId}
          currentUserId={authUid}
          currentUserRole={userRole}
          currentUserName={resolvedUserName}
          clientId={dispute.order.client_id || dispute.order.client?.user_id}
          providerId={dispute.order.provider?.user_id || dispute.order.provider_id}
          clientName={dispute.order.client ? `${dispute.order.client.first_name} ${dispute.order.client.last_name}` : t('mediation.roles.client')}
          providerName={dispute.order.provider ? `${dispute.order.provider.first_name} ${dispute.order.provider.last_name}` : t('mediation.roles.provider')}
        />
      )}
    </>
  );
}
