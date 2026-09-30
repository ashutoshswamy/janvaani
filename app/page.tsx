"use client";
import Image from "next/image";
import Link from "next/link";
import { User, Building2 } from "lucide-react";
import { STATS } from "@/lib/mock-data";
import hero from "@/public/hero.png";
import feature1 from "@/public/feature1.png";
import feature2 from "@/public/feature2.png";
import feature3 from "@/public/feature3.png";
import { LANG_OPTIONS, useLang } from "@/components/lang";
import { LangSelect } from "@/components/lang-select";
import { btn, cx, InfoBox, Logo } from "@/components/ui";

const STEP_IMAGES = [feature1, feature2, feature3];

export default function Landing() {
  const { t, num, lang, setLang } = useLang();
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-100 via-orange-50 to-indigo-200 text-indigo-950">
        <div className="pointer-events-none absolute -right-40 -top-40 size-[32rem] rounded-full bg-orange-200/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 size-96 rounded-full bg-indigo-200/70 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <header className="flex items-center justify-between gap-4 py-5">
            <Logo />
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-slate-600 md:block">{t.dpg}</span>
              <LangSelect />
            </div>
          </header>
          <div className="grid items-end gap-6 lg:grid-cols-[1.05fr_1fr]">
          <div className="fade-in py-12 sm:py-20 lg:py-24">
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl 2xl:text-6xl">
              {t.heroA}<span className="text-orange-700">{t.heroB}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-700">{t.heroSub}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/citizen" className={`${btn.accent} px-7 py-4 text-base`}>
                <User className="size-5" /> {t.citizen}
              </Link>
              <Link href="/admin" className={`${btn.base} border border-indigo-200 bg-white px-7 py-4 text-base text-indigo-950 hover:bg-indigo-50`}>
                <Building2 className="size-5" /> {t.official}
              </Link>
            </div>
          </div>
          {/* Figures stand on the language strip below, so no bottom padding here. */}
          <Image
            src={hero}
            alt={t.heroAlt}
            priority
            sizes="(min-width: 1024px) 680px, 90vw"
            // The PNG is transparent top-left, so on desktop it grows leftwards into the gap; right edge stays put so no bubble is clipped.
            className="fade-in pointer-events-none mx-auto -mt-8 w-full max-w-md select-none self-end sm:max-w-lg lg:-ml-[16%] lg:mt-0 lg:w-[116%] lg:max-w-none"
          />
          </div>
        </div>
        <div className="relative border-t border-indigo-200/70 bg-white/50">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-5 text-lg text-slate-700">
            {LANG_OPTIONS.map(([k, label]) => (
              <button key={k} onClick={() => setLang(k)} aria-pressed={lang === k} className={lang === k ? "font-semibold text-indigo-950 underline decoration-orange-500 decoration-2 underline-offset-8" : "hover:text-indigo-950"}>{label}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-indigo-950">{t.how}</h2>
        {/* Zigzag rows threaded by a dashed path: the steps are a real sequence, so the path carries the order. */}
        <ol className="relative mt-14 space-y-14 md:space-y-10">
          <span aria-hidden className="absolute inset-y-8 left-1/2 hidden -translate-x-1/2 border-l-2 border-dashed border-orange-300 md:block" />
          {t.steps.map(([title, body, alt], i) => (
            <li key={i} className="relative grid items-center gap-6 md:grid-cols-2 md:gap-24">
              {/* Transparent PNGs with a soft glow; the cream wash gives the glow something to sit on. */}
              <div className={cx("rounded-3xl bg-gradient-to-b from-orange-50 to-white p-3 ring-1 ring-slate-200", i % 2 === 1 && "md:order-2")}>
                <Image src={STEP_IMAGES[i]} alt={alt} sizes="(min-width: 768px) 520px, 92vw" className="h-auto w-full" />
              </div>
              <div>
                <span className="mb-3 grid size-9 place-items-center rounded-full bg-orange-500 text-sm font-bold text-indigo-950 md:hidden">{i + 1}</span>
                <h3 className="text-2xl font-semibold tracking-tight text-indigo-950">{title}</h3>
                <p className="mt-3 max-w-md text-lg text-slate-600">{body}</p>
              </div>
              <span aria-hidden className="absolute left-1/2 top-1/2 hidden size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-orange-500 text-base font-bold text-indigo-950 ring-8 ring-indigo-50 md:grid">{i + 1}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white">
        {/* Padding lives on this wrapper so the note's spacing can't collapse out of the white band. */}
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
            {([
              [STATS.totalRequests, t.statRequests, true],
              [STATS.states, t.statStates, false],
              [STATS.districts, t.statDistricts, false],
              [STATS.resolved, t.statResolved, true],
              [STATS.languages, t.statLanguages, false],
            ] as const).map(([v, l, sample], i, all) => (
              // Odd count: on the 2-column phone grid the last stat spans both columns instead of sitting alone.
              <div key={l} className={cx("text-center", i === all.length - 1 && "col-span-2 md:col-span-1")}>
                <p className="text-4xl font-bold text-indigo-950">
                  {num(v)}
                  {sample && <sup className="ml-0.5 text-lg font-semibold text-sky-700" aria-hidden>*</sup>}
                </p>
                <p className="mt-1 text-sm text-slate-500">{l}</p>
              </div>
            ))}
          </div>
          <InfoBox className="mx-auto mt-10 max-w-2xl">
            <span aria-hidden className="font-semibold text-sky-700">* </span>
            {t.demoStats}
          </InfoBox>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white text-slate-600">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:px-6">
          <Logo />
          <p className="text-center text-slate-500 sm:text-right">
            {/* Sentence is split around {team} because word order differs by language. */}
            {t.credit.split("{team}")[0]}
            <span className="font-semibold text-indigo-950">Mainframe Hustlers</span>
            {t.credit.split("{team}")[1]}
            {" · "}
            <span className="whitespace-nowrap">Ashutosh Swamy</span> & <span className="whitespace-nowrap">Sairaj Dhuri</span>
          </p>
        </div>
      </footer>
    </main>
  );
}
