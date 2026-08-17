"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ParqAnswers } from "@/lib/types";

const questions: { key: keyof ParqAnswers; text: string }[] = [
  { key: "chestPain", text: "Do you ever feel chest pain during physical activity?" },
  { key: "dizziness", text: "Have you ever lost consciousness or felt dizzy during exercise?" },
  { key: "jointProblem", text: "Do you have a bone or joint problem that could be made worse by exercise?" },
  { key: "cardiacMedication", text: "Are you currently on medication for a heart condition or blood pressure?" },
  { key: "doctorRestriction", text: "Has a doctor told you not to exercise, or to exercise only under supervision?" },
  { key: "pregnancy", text: "Are you currently pregnant?" },
  { key: "otherReason", text: "Is there another reason you know of not to do physical activity?" },
];
const choices = {
  goals: [["build_muscle", "Build muscle"], ["lose_fat", "Lose fat"], ["improve_strength", "Improve strength"], ["improve_endurance", "Improve endurance"], ["general_fitness", "General fitness"], ["mobility", "Mobility"]],
  experience: [["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]],
  equipment: [["full_gym", "Full gym"], ["dumbbells", "Dumbbells"], ["barbell", "Barbell"], ["resistance_bands", "Resistance bands"], ["bodyweight", "Bodyweight"], ["home_gym", "Home gym"]],
  location: [["gym", "Gym"], ["home", "Home"], ["outdoor", "Outdoor"]],
};
type Contra = { body_part: string; severity: "avoid_entirely" | "manage_around"; note: string };

export default function OnboardingPage() {
  const router = useRouter(); const [step, setStep] = useState(0); const [error, setError] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [profile, setProfile] = useState({ name: "", age: "", height: "", weight: "", sex: "", units: "metric" });
  const [goal, setGoal] = useState(""); const [experience, setExperience] = useState(""); const [equipment, setEquipment] = useState<string[]>([]); const [location, setLocation] = useState(""); const [days, setDays] = useState(""); const [duration, setDuration] = useState("");
  const [answers, setAnswers] = useState<Partial<ParqAnswers>>({}); const [ack, setAck] = useState(false); const [contra, setContra] = useState<Contra[]>([]);
  const flagged = Object.values(answers).some(Boolean); const safetyComplete = Object.keys(answers).length === questions.length;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login?redirect=/onboarding");
        return;
      }
      setCheckingAuth(false);
    });
  }, [router]);

  const advance = () => {
    setError(null);
    if (step === 0 && (!profile.name.trim() || !Number(profile.age) || !Number(profile.height) || !Number(profile.weight))) return setError("Enter your name, age, height, and weight.");
    if (step === 1 && !goal) return setError("Choose a fitness goal."); if (step === 2 && !experience) return setError("Choose your experience level.");
    if (step === 3 && !equipment.length) return setError("Choose at least one equipment option."); if (step === 4 && !location) return setError("Choose a workout location.");
    if (step === 5 && (!Number(days) || Number(days) < 1 || Number(days) > 7)) return setError("Choose between 1 and 7 days.");
    if (step === 6 && (!Number(duration) || Number(duration) < 10 || Number(duration) > 180)) return setError("Choose a duration between 10 and 180 minutes.");
    setStep((current) => current + 1);
  };
  function toggleEquipment(value: string) { setEquipment((items) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value]); }
  function updateContra(index: number, key: keyof Contra, value: string) { setContra((items) => items.map((item, i) => i === index ? { ...item, [key]: value } : item)); }
  async function complete() {
    if (!safetyComplete) return setError("Answer every readiness question."); if (flagged && !ack) return setError("You must confirm your self-attested professional clearance to continue.");
    if (contra.some((item) => !item.body_part.trim())) return setError("Enter a body part for each item you add.");
    setSaving(true); setError(null); const supabase = createClient();
    const heightCm = profile.units === "imperial" ? Number(profile.height) * 2.54 : Number(profile.height); const weightKg = profile.units === "imperial" ? Number(profile.weight) * 0.45359237 : Number(profile.weight);
    const { error: rpcError } = await supabase.rpc("complete_onboarding", { p_name: profile.name, p_age: Number(profile.age), p_height_cm: heightCm, p_weight_kg: weightKg, p_sex: profile.sex, p_units: profile.units, p_goal: goal, p_experience_level: experience, p_equipment: equipment, p_workout_location: location, p_days_per_week: Number(days), p_session_duration_minutes: Number(duration), p_parq_answers: answers, p_professional_clearance_ack: ack, p_contraindications: contra });
    setSaving(false); if (rpcError) return setError(rpcError.message); router.replace("/home");
  }
  const optionButtons = (items: string[][], selected: string, choose: (value: string) => void) => <div className="grid gap-2">{items.map(([value, label]) => <button key={value} onClick={() => choose(value)} className={`rounded-xl border p-3 text-left ${selected === value ? "border-accent bg-accent/20" : "border-white/10 bg-white/5"}`}>{label}</button>)}</div>;

  if (checkingAuth) {
    return <main className="app-shell max-w-xl"><p className="text-sm text-white/60">Loading…</p></main>;
  }

  return <main className="app-shell max-w-xl"><p className="eyebrow">Setup {step + 1} of 8</p><h1 className="page-title mt-1 mb-6">{["A few basics", "Your goal", "Experience", "Equipment", "Workout location", "Days per week", "Session duration", "Readiness check"][step]}</h1>
    <div className="flex gap-1 mb-8">{Array.from({ length: 8 }, (_, i) => <div key={i} className={`h-1 flex-1 rounded ${i <= step ? "bg-accent" : "bg-white/10"}`} />)}</div>
    {step === 0 && <div className="space-y-3"><label className="block text-sm">Name<input maxLength={80} value={profile.name} onChange={(e) => setProfile({...profile,name:e.target.value})} className="mt-1 input" /></label><div className="grid grid-cols-2 gap-3"><label className="text-sm">Age<input type="number" min="13" max="120" value={profile.age} onChange={(e) => setProfile({...profile,age:e.target.value})} className="mt-1 input" /></label><label className="text-sm">Sex (optional)<input maxLength={40} value={profile.sex} onChange={(e) => setProfile({...profile,sex:e.target.value})} className="mt-1 input" /></label></div><div className="grid grid-cols-2 gap-3"><label className="text-sm">Height ({profile.units === "metric" ? "cm" : "in"})<input type="number" value={profile.height} onChange={(e) => setProfile({...profile,height:e.target.value})} className="mt-1 input" /></label><label className="text-sm">Weight ({profile.units === "metric" ? "kg" : "lb"})<input type="number" value={profile.weight} onChange={(e) => setProfile({...profile,weight:e.target.value})} className="mt-1 input" /></label></div><label className="text-sm">Units<select value={profile.units} onChange={(e) => setProfile({...profile,units:e.target.value})} className="mt-1 input"><option value="metric">Metric</option><option value="imperial">Imperial</option></select></label></div>}
    {step === 1 && optionButtons(choices.goals, goal, setGoal)}{step === 2 && optionButtons(choices.experience, experience, setExperience)}
    {step === 3 && <div className="grid gap-2">{choices.equipment.map(([value,label]) => <label key={value} className="rounded-xl border border-white/10 bg-white/5 p-3"><input type="checkbox" checked={equipment.includes(value)} onChange={() => toggleEquipment(value)} className="mr-2" />{label}</label>)}</div>}
    {step === 4 && optionButtons(choices.location, location, setLocation)}
    {step === 5 && <label className="block text-sm">Training days each week<input type="number" min="1" max="7" value={days} onChange={(e) => setDays(e.target.value)} className="mt-1 input" /></label>}
    {step === 6 && <label className="block text-sm">Minutes per session<input type="number" min="10" max="180" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1 input" /></label>}
    {step === 7 && <div className="space-y-5"><p className="text-sm text-white/60">This is not medical advice or a diagnosis. Your answers help determine whether setup should pause.</p>{questions.map((question) => <fieldset key={question.key}><legend className="text-sm mb-2">{question.text}</legend><div className="flex gap-3"><button onClick={() => setAnswers({...answers,[question.key]:true})} className={`flex-1 rounded-xl border py-2 ${answers[question.key] === true ? "border-stop bg-stop/10 text-stop" : "border-white/10"}`}>Yes</button><button onClick={() => setAnswers({...answers,[question.key]:false})} className={`flex-1 rounded-xl border py-2 ${answers[question.key] === false ? "border-safe bg-safe/10 text-safe" : "border-white/10"}`}>No</button></div></fieldset>)}
      {flagged && safetyComplete && <div className="rounded-xl border border-stop bg-stop/10 p-4"><p className="font-semibold text-stop">We’ve paused plan access</p><p className="mt-2 text-sm text-white/70">This app does not medically clear you. Continue only if you have independently spoken with an appropriate healthcare professional and they have cleared you for exercise.</p><label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />I self-attest that I have received professional clearance.</label></div>}
      <div><p className="text-sm font-medium mb-2">Anything to plan around? (optional)</p>{contra.map((item,index) => <div key={index} className="mb-2 rounded-xl bg-white/5 p-3 space-y-2"><input placeholder="Body part, e.g. knee" value={item.body_part} onChange={(e) => updateContra(index,"body_part",e.target.value)} className="input"/><select value={item.severity} onChange={(e) => updateContra(index,"severity",e.target.value)} className="input"><option value="avoid_entirely">Avoid entirely</option><option value="manage_around">Manage around</option></select><input placeholder="Optional note" maxLength={1000} value={item.note} onChange={(e) => updateContra(index,"note",e.target.value)} className="input"/><button onClick={() => setContra(contra.filter((_,i) => i !== index))} className="text-sm text-stop">Remove</button></div>)}<button onClick={() => setContra([...contra,{body_part:"",severity:"manage_around",note:""}])} className="text-sm text-accent">+ Add an item</button></div></div>}
    {error && <p role="alert" className="mt-4 text-sm text-stop">{error}</p>}<div className="mt-8 flex gap-3">{step > 0 && <button onClick={() => { setError(null); setStep(step - 1); }} className="rounded-xl border border-white/20 px-4 py-3">Back</button>}<button onClick={step === 7 ? complete : advance} disabled={saving || (step === 7 && flagged && !ack)} className="flex-1 rounded-xl bg-accent py-3 font-semibold disabled:bg-white/10">{saving ? "Saving…" : step === 7 ? "Complete setup" : "Continue"}</button></div>
  </main>;
}