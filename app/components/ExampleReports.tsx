"use client";

import { useMemo } from "react";
import { FileIcon, defaultStyles } from "react-file-icon";
import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "@/app/i18n";

const FILE_TYPES = [
  { ext: "pdf", styles: defaultStyles.pdf },
  { ext: "pptx", styles: defaultStyles.pptx },
  { ext: "xlsx", styles: defaultStyles.xlsx },
  { ext: "docx", styles: defaultStyles.docx },
];

interface ExampleReportsProps {
  onSelectExample: (taskId: string, title: string) => void;
}

export default function ExampleReports({ onSelectExample }: ExampleReportsProps) {
  const { t } = useTranslation();

  const exampleReports = useMemo(() => [
    {
      id: "5e106dbf-f5e4-4189-8fcb-7a800b2b6dba",
      title: t("examples.report1Title"),
      subtitle: t("examples.report1Subtitle"),
      type: t("examples.report1Type"),
    },
    {
      id: "ba7b7848-d338-4272-8499-276f3679a835",
      title: t("examples.report2Title"),
      subtitle: t("examples.report2Subtitle"),
      type: t("examples.report2Type"),
    },
    {
      id: "1e358083-84c7-43a4-af74-a1cffa98e933",
      title: t("examples.report3Title"),
      subtitle: t("examples.report3Subtitle"),
      type: t("examples.report3Type"),
    },
    {
      id: "22e7a435-7237-4c9a-b3d4-2ebc4b75cbf9",
      title: t("examples.report4Title"),
      subtitle: t("examples.report4Subtitle"),
      type: t("examples.report4Type"),
    },
  ], [t]);

  return (
    <div>
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="h-px flex-1 max-w-16 bg-border" />
        <span className="text-[11px] text-text-muted uppercase tracking-wider font-medium">{t("examples.heading")}</span>
        <div className="h-px flex-1 max-w-16 bg-border" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {exampleReports.map((report) => (
          <button
            key={report.id}
            onClick={() => onSelectExample(report.id, report.title)}
            className="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-surface/50 hover:bg-surface-hover hover:border-primary/30 transition-all text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {report.title}
                </span>
                <ArrowUpRight className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-primary/70 bg-primary/8 px-1.5 py-0.5 rounded">
                  {report.type}
                </span>
                <div className="flex items-center gap-1">
                  {FILE_TYPES.map(({ ext, styles }) => (
                    <div key={ext} className="w-2.5">
                      <FileIcon extension={ext} {...styles} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
