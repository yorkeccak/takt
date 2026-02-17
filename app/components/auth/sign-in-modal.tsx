"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/app/i18n";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { initiateOAuthFlow, isOAuthConfigured } from "@/app/lib/oauth";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInModal({ open, onOpenChange }: SignInModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleValyuSignIn = async () => {
    setIsLoading(true);
    setError(null);

    if (!isOAuthConfigured()) {
      setError(t("signIn.oauthError"));
      setIsLoading(false);
      return;
    }

    try {
      await initiateOAuthFlow();
    } catch (err) {
      console.error("OAuth initiation error:", err);
      setError(t("signIn.signInError"));
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} className="max-w-md">
      <DialogHeader onClose={handleClose}>
        <DialogTitle className="text-center text-xl">{t("signIn.title")}</DialogTitle>
      </DialogHeader>
      <DialogContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-center text-base font-medium text-foreground">
            Takt
          </p>
          <p className="text-center text-sm text-muted-foreground">
            {t("signIn.description")}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-error/10 border border-error/20 p-3 text-sm text-error">
            {error}
          </div>
        )}

        <Button
          onClick={handleValyuSignIn}
          disabled={isLoading}
          className="w-full h-12"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              {t("signIn.redirecting")}
            </>
          ) : (
            <>
              {t("signIn.button")}
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("signIn.noAccount")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
