"use client";

import { useState, useMemo } from "react";
import { Building2, Check, Loader2, ExternalLink, X } from "lucide-react";
import { useTranslation } from "@/app/i18n";

interface EnterpriseContactModalProps {
  open: boolean;
  onClose: () => void;
}

export default function EnterpriseContactModal({ open, onClose }: EnterpriseContactModalProps) {
  const [formData, setFormData] = useState({
    companyName: "",
    companySize: "",
    industry: "",
    contactName: "",
    contactEmail: "",
    jobTitle: "",
    useCase: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [bookedCall, setBookedCall] = useState(false);
  const { t } = useTranslation();

  const companySizes = useMemo(() => [
    t("enterprise.size1"), t("enterprise.size2"), t("enterprise.size3"),
    t("enterprise.size4"), t("enterprise.size5"), t("enterprise.size6"),
  ], [t]);

  const industries = useMemo(() => [
    t("enterprise.indOem"), t("enterprise.indTier1"), t("enterprise.indTier23"),
    t("enterprise.indConsulting"), t("enterprise.indBattery"), t("enterprise.indAutonomous"),
    t("enterprise.indFleet"), t("enterprise.indAftermarket"), t("enterprise.indSemiconductor"),
    t("enterprise.indHyperscaler"), t("enterprise.indMobility"), t("enterprise.indOther"),
  ], [t]);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isFormValid = () => {
    return formData.companyName && formData.contactName && formData.contactEmail && formData.jobTitle && formData.useCase;
  };

  const handleSubmit = async (shouldBookCall: boolean) => {
    if (!isFormValid()) return;

    setIsSubmitting(true);
    setBookedCall(shouldBookCall);

    try {
      const response = await fetch("/api/enterprise/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, bookedCall: shouldBookCall }),
      });

      if (response.ok) {
        setSubmitSuccess(true);

        if (shouldBookCall) {
          window.open(process.env.NEXT_PUBLIC_CALENDLY_URL || "#", "_blank");
        }

        setTimeout(() => {
          setFormData({
            companyName: "",
            companySize: "",
            industry: "",
            contactName: "",
            contactEmail: "",
            jobTitle: "",
            useCase: "",
          });
          setSubmitSuccess(false);
          setBookedCall(false);
          onClose();
        }, 3000);
      }
    } catch {
      // Silently fail
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-xl shadow-2xl w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-surface rounded-lg transition-colors z-10">
          <X className="w-5 h-5 text-text-muted" />
        </button>

        {submitSuccess ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{t("enterprise.thanks")}</h3>
            <p className="text-sm text-text-muted">
              {bookedCall ? t("enterprise.bookingCall") : t("enterprise.inTouch")}
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-surface rounded-2xl mb-4">
                <Building2 className="w-7 h-7 text-foreground" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                {t("enterprise.title")}
              </h2>
              <p className="text-text-muted text-sm max-w-md mx-auto">
                {t("enterprise.subtitle")}
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">{t("enterprise.companyDetails")}</h3>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-text-muted mb-1">
                    {t("enterprise.companyName")} <span className="text-red-500">*</span>
                  </label>
                  <input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange}
                    placeholder="Volkswagen Group" className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="companySize" className="block text-sm font-medium text-text-muted mb-1">{t("enterprise.companySize")}</label>
                    <select id="companySize" name="companySize" value={formData.companySize} onChange={handleChange}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary">
                      <option value="">{t("enterprise.selectSize")}</option>
                      {companySizes.map((size) => (<option key={size} value={size}>{size}</option>))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-text-muted mb-1">{t("enterprise.industry")}</label>
                    <select id="industry" name="industry" value={formData.industry} onChange={handleChange}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary">
                      <option value="">{t("enterprise.selectIndustry")}</option>
                      {industries.map((industry) => (<option key={industry} value={industry}>{industry}</option>))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">{t("enterprise.yourDetails")}</h3>
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-text-muted mb-1">
                    {t("enterprise.fullName")} <span className="text-red-500">*</span>
                  </label>
                  <input type="text" id="contactName" name="contactName" value={formData.contactName} onChange={handleChange}
                    placeholder="Max Mustermann" className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium text-text-muted mb-1">
                      {t("enterprise.email")} <span className="text-red-500">*</span>
                    </label>
                    <input type="email" id="contactEmail" name="contactEmail" value={formData.contactEmail} onChange={handleChange}
                      placeholder="max@volkswagen.de" className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
                  </div>
                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-text-muted mb-1">
                      {t("enterprise.jobTitle")} <span className="text-red-500">*</span>
                    </label>
                    <input type="text" id="jobTitle" name="jobTitle" value={formData.jobTitle} onChange={handleChange}
                      placeholder="Head of Procurement" className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="useCase" className="block text-sm font-medium text-text-muted mb-1">
                  {t("enterprise.useCase")} <span className="text-red-500">*</span>
                </label>
                <textarea id="useCase" name="useCase" value={formData.useCase} onChange={handleChange} rows={4}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                  placeholder="Describe your automotive intelligence needs, supply chain requirements, or research automation goals..." />
              </div>

              <div className="bg-surface border border-border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">{t("enterprise.security")}</p>
                    <p className="text-text-muted">{t("enterprise.trusted")}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSubmit(true)}
                disabled={!isFormValid() || isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{t("enterprise.submitAndBook")}</span>
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
