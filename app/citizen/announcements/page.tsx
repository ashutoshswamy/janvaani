"use client";
import { useAnnouncements } from "@/components/data";
import { useLang } from "@/components/lang";
import { AnnouncementCard } from "@/components/announcement-card";
import { Card, InfoBox, PageTitle, Spinner } from "@/components/ui";
import { isDemoAnnouncement } from "@/lib/mock-data";

export default function CitizenAnnouncements() {
  const { t, lang } = useLang();
  const anns = useAnnouncements(true);
  return (
    <div className="fade-in">
      <PageTitle title={t.announcements} sub={t.annSub} />
      {!anns ? (
        <Card className="grid place-items-center p-16"><Spinner /></Card>
      ) : !anns.length ? (
        <Card className="p-16 text-center text-slate-500">{t.empty.announcements}</Card>
      ) : (
        <>
        {anns.some(isDemoAnnouncement) && <InfoBox className="mb-5">{t.demoAnnouncements}</InfoBox>}
        <div className="grid gap-5 sm:grid-cols-2">
          {anns.map((a) => <AnnouncementCard key={a.id + lang} a={a} />)}
        </div>
        </>
      )}
    </div>
  );
}
