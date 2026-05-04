'use client';

import { useMemo, useState } from 'react';
import Navigation from '@/components/navigation';
import { Input } from '@/components/ui/input';
import {
  Activity,
  AlertTriangle,
  Bandage,
  Bone,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Droplet,
  Flame,
  HeartPulse,
  LifeBuoy,
  PhoneCall,
  Siren,
} from 'lucide-react';

type Guide = {
  id: string;
  title: string;
  summary: string;
  icon: typeof Activity;
  steps: string[];
  tips: string[];
  warningSigns: string[];
  callWhen: string[];
  keywords: string[];
};

const quickSteps = [
  {
    title: 'Call emergency services',
    description: 'Dial 911 or your local emergency number and share your location.',
    icon: PhoneCall,
  },
  {
    title: 'Check for danger',
    description: 'Make sure the scene is safe before helping.',
    icon: AlertTriangle,
  },
  {
    title: 'Check breathing',
    description: 'If not breathing normally, start CPR and use an AED if available.',
    icon: Activity,
  },
  {
    title: 'Stop bleeding',
    description: 'Apply firm pressure with a clean cloth or bandage.',
    icon: Droplet,
  },
];

const guides: Guide[] = [
  {
    id: 'cpr',
    title: 'CPR',
    summary: 'For unresponsive people who are not breathing normally.',
    icon: Activity,
    steps: [
      'Check responsiveness and breathing for no more than 10 seconds.',
      'Call emergency services or ask someone nearby to call.',
      'Place the person on their back on a firm surface.',
      'Place both hands in the center of the chest.',
      'Push hard and fast at 100 to 120 compressions per minute.',
      'After 30 compressions, give 2 rescue breaths if trained.',
      'Continue CPR until help arrives or the person starts breathing.',
      'Use an AED as soon as it is available and follow prompts.',
    ],
    tips: [
      'Keep your elbows locked and shoulders above your hands.',
      'Allow the chest to fully rise between compressions.',
      'Switch rescuers every 2 minutes if possible to avoid fatigue.',
    ],
    warningSigns: [
      'No breathing or only gasping breaths.',
      'Unresponsive to touch or voice.',
      'Blue or gray skin around lips or fingertips.',
    ],
    callWhen: [
      'Immediately when someone is unresponsive or not breathing normally.',
    ],
    keywords: ['cpr', 'unresponsive', 'not breathing', 'aed', 'cardiac arrest'],
  },
  {
    id: 'burns',
    title: 'Burns',
    summary: 'Cool the burn and protect the injured area.',
    icon: Flame,
    steps: [
      'Move the person away from the heat source.',
      'Cool the burn with cool running water for 10 to 20 minutes.',
      'Remove jewelry or tight clothing before swelling begins.',
      'Cover with a clean, dry, non-stick dressing.',
      'Do not apply ice, butter, or creams to severe burns.',
    ],
    tips: [
      'Keep the person warm to prevent shock.',
      'Elevate the burned area if it does not cause pain.',
    ],
    warningSigns: [
      'Charred or white skin and severe pain or numbness.',
      'Burns on the face, hands, feet, or genitals.',
      'Blistering larger than the size of the injured person’s hand.',
    ],
    callWhen: [
      'Any large, deep, or electrical burn.',
      'Burns with trouble breathing or signs of shock.',
    ],
    keywords: ['burn', 'scald', 'fire', 'blister', 'smoke'],
  },
  {
    id: 'fractures',
    title: 'Fractures',
    summary: 'Immobilize the injury and reduce swelling.',
    icon: Bone,
    steps: [
      'Keep the injured area still and supported.',
      'Apply a cold pack wrapped in cloth for 10 minutes at a time.',
      'Use a splint or sling to immobilize the joint above and below.',
      'Check circulation beyond the injury every few minutes.',
      'Do not attempt to realign the bone.',
    ],
    tips: [
      'Pad any splint to avoid pressure points.',
      'Remove rings or tight items before swelling increases.',
    ],
    warningSigns: [
      'Bone visible through the skin.',
      'Severe deformity, numbness, or loss of movement.',
      'Severe pain after a fall or impact.',
    ],
    callWhen: [
      'Suspected spine, head, or hip fracture.',
      'Open fractures or loss of circulation.',
    ],
    keywords: ['fracture', 'broken', 'bone', 'sprain', 'splint'],
  },
  {
    id: 'bleeding',
    title: 'Bleeding',
    summary: 'Stop bleeding quickly and watch for shock.',
    icon: Droplet,
    steps: [
      'Apply firm, direct pressure with a clean cloth.',
      'Add more layers if blood soaks through; do not remove the first layer.',
      'If possible, elevate the injury above the heart.',
      'Secure the dressing with a bandage once bleeding slows.',
      'Keep the person warm and calm.',
    ],
    tips: [
      'Wear gloves if available.',
      'Apply steady pressure for at least 10 minutes.',
    ],
    warningSigns: [
      'Spurting blood or rapidly soaking dressings.',
      'Dizziness, pale skin, or confusion.',
      'Blood from the mouth, nose, or ears after an injury.',
    ],
    callWhen: [
      'Bleeding will not stop within 10 minutes.',
      'Large wounds, amputations, or signs of shock.',
    ],
    keywords: ['bleeding', 'hemorrhage', 'blood loss', 'pressure'],
  },
  {
    id: 'choking',
    title: 'Choking',
    summary: 'Clear the airway quickly using back blows and thrusts.',
    icon: Siren,
    steps: [
      'Ask if the person is choking and cannot speak or cough.',
      'Give 5 firm back blows between the shoulder blades.',
      'Give 5 abdominal thrusts just above the navel.',
      'Repeat back blows and thrusts until the object is removed.',
      'Call emergency services if the object does not come out.',
      'Begin CPR if the person becomes unresponsive.',
    ],
    tips: [
      'Use chest thrusts for pregnant or larger adults.',
      'For infants, use back slaps and chest thrusts only.',
    ],
    warningSigns: [
      'Unable to speak, breathe, or cough.',
      'Hands grasping the throat and blue lips.',
    ],
    callWhen: [
      'Choking lasts more than 1 minute or the person collapses.',
    ],
    keywords: ['choking', 'airway', 'heimlich', 'cannot breathe'],
  },
  {
    id: 'heart-attack',
    title: 'Heart Attack',
    summary: 'Call immediately and keep the person calm and still.',
    icon: HeartPulse,
    steps: [
      'Call emergency services right away.',
      'Help the person sit down and rest in a comfortable position.',
      'Loosen tight clothing and keep them warm.',
      'Give aspirin if they are not allergic and are able to chew.',
      'Monitor breathing and be ready to start CPR.',
    ],
    tips: [
      'Stay calm and reassure the person.',
      'Keep a note of when symptoms started for responders.',
    ],
    warningSigns: [
      'Chest pressure, squeezing, or pain.',
      'Pain in the arm, back, jaw, or stomach.',
      'Shortness of breath, cold sweat, or nausea.',
    ],
    callWhen: [
      'Immediately at the first signs of chest pain or severe discomfort.',
    ],
    keywords: ['heart attack', 'chest pain', 'cardiac', 'shortness of breath'],
  },
];

export default function FirstAidPage() {
  const [expanded, setExpanded] = useState<string | null>('cpr');
  const [query, setQuery] = useState('');

  const filteredGuides = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return guides;
    }

    return guides.filter((guide) => {
      const haystack = [
        guide.title,
        guide.summary,
        ...guide.keywords,
        ...guide.steps,
        ...guide.tips,
        ...guide.warningSigns,
        ...guide.callWhen,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [query]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <BookOpen className="w-6 h-6 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-white">First Aid Guide</h1>
            </div>
            <p className="text-gray-300 max-w-2xl">
              Clear, step-by-step guidance for common emergencies. This guide is cached for offline use.
            </p>
          </div>
          <div className="w-full max-w-md">
            <label className="text-sm text-slate-300">Search topics</label>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search CPR, burns, heart attack, bleeding..."
              className="mt-2 bg-slate-900/60 border-slate-700 text-white"
            />
          </div>
        </div>

        <section className="mb-12">
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-rose-300 mb-4">
            <LifeBuoy className="h-4 w-4" />
            Quick Emergency Steps
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {quickSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{step.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">First Aid Topics</h2>
            <p className="text-sm text-slate-400">{filteredGuides.length} topics</p>
          </div>

          {filteredGuides.length === 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-6 text-slate-300">
              No topics match your search. Try a different keyword.
            </div>
          )}

          <div className="grid gap-4">
            {filteredGuides.map((guide) => {
              const Icon = guide.icon;
              const isOpen = expanded === guide.id;

              return (
                <div
                  key={guide.id}
                  className="rounded-xl border border-slate-700 bg-slate-800/30 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : guide.id)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/60 text-rose-300">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{guide.title}</h3>
                        <p className="text-sm text-slate-400">{guide.summary}</p>
                      </div>
                    </div>
                    <div className="text-slate-400">
                      {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-700 px-6 py-6 space-y-6">
                      <div>
                        <p className="text-sm font-semibold text-rose-200">Step-by-step instructions</p>
                        <ol className="mt-3 space-y-3">
                          {guide.steps.map((step, index) => (
                            <li key={step} className="flex gap-3 text-sm text-slate-300">
                              <span className="flex h-6 w-6 items-center justify-center rounded bg-rose-500/20 text-rose-200 text-xs font-semibold">
                                {index + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
                          <p className="text-sm font-semibold text-white">Emergency tips</p>
                          <ul className="mt-3 space-y-2 text-sm text-slate-300">
                            {guide.tips.map((tip) => (
                              <li key={tip}>- {tip}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
                          <p className="text-sm font-semibold text-white">Warning signs</p>
                          <ul className="mt-3 space-y-2 text-sm text-slate-300">
                            {guide.warningSigns.map((sign) => (
                              <li key={sign}>- {sign}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4">
                          <p className="text-sm font-semibold text-rose-200">When to call emergency services</p>
                          <ul className="mt-3 space-y-2 text-sm text-rose-100">
                            {guide.callWhen.map((item) => (
                              <li key={item}>- {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-12 rounded-xl border border-rose-500/40 bg-rose-500/10 p-6">
          <div className="flex items-center gap-3">
            <Bandage className="h-5 w-5 text-rose-300" />
            <h3 className="text-lg font-semibold text-white">Important reminder</h3>
          </div>
          <p className="mt-3 text-sm text-rose-100">
            These instructions are for guidance only and do not replace professional medical care.
            Call emergency services whenever you suspect a life-threatening condition.
          </p>
        </section>
      </div>
    </main>
  );
}
