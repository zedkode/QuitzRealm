import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { ArrowRight, Crown, Eye, Flame, LogIn, Play, Sparkles, Swords, Trophy, Users } from "lucide-react";
import { quizRealmApi } from "@/lib/quizrealm";

const fallbackStats = [
  { label: "Active players", value: "—", delta: "awaiting realm signal", icon: Users },
  { label: "Matches today", value: "—", delta: "server verified", icon: Trophy },
  { label: "Questions mastered", value: "—", delta: "server verified", icon: Sparkles },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState(fallbackStats);
  useEffect(() => {
    let mounted = true;
    const load = () => quizRealmApi.stats().then((data) => { if (!mounted) return; setStats([
      { label: "Active players", value: data.activePlayers.toLocaleString(), delta: "live sessions", icon: Users },
      { label: "Matches today", value: data.matchesToday.toLocaleString(), delta: "server verified", icon: Trophy },
      { label: "Questions mastered", value: data.questionsMastered.toLocaleString(), delta: "answers recorded", icon: Sparkles },
    ]); }).catch(() => undefined);
    load(); const refresh = window.setInterval(load, 30_000);
    return () => { mounted = false; window.clearInterval(refresh); };
  }, []);
  const enterAuth = () => setLocation("/auth");
  return <div className="starfield min-h-screen">
    <div className="mx-auto max-w-[1440px] px-5 pb-16 lg:px-10">
      <header className="flex h-24 items-center justify-between">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#d9b45a]/35 bg-[#211933] text-[#e3c36a] shadow-[0_0_30px_rgba(126,92,199,.25)]"><Crown size={21}/></div><div><div className="font-display text-base tracking-wide text-[#f7e7b0]">QUIZREALM</div><div className="eyebrow !text-[.54rem]">A kingdom of knowledge</div></div></div>
        <div className="hidden items-center gap-7 text-sm text-[#a69ead] md:flex"><a href="#world" className="hover:text-white">The world</a><a href="#modes" className="hover:text-white">Game modes</a><a href="#hall" className="hover:text-white">Hall of fame</a></div>
        <button onClick={enterAuth} className="flex items-center gap-2 rounded-xl border border-[#d9b45a]/30 px-4 py-2.5 text-sm font-semibold text-[#f3d47c] hover:bg-[#d9b45a]/10"><LogIn size={16}/>Sign in</button>
      </header>
      <section className="grid min-h-[610px] items-center gap-12 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
        <div className="animate-rise max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#7e5cc7]/40 bg-[#7e5cc7]/10 px-3 py-1.5 text-xs font-semibold text-[#c4b3f3]"><span className="h-1.5 w-1.5 rounded-full bg-[#bba3ff] shadow-[0_0_12px_#bba3ff]"/> Season I · The Veiled Constellation</div>
          <h1 className="font-display text-5xl leading-[1.1] text-[#fff4d2] sm:text-6xl lg:text-8xl">Claim the <span className="text-[#d9b45a] drop-shadow-[0_0_22px_rgba(217,180,90,.28)]">unknown.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#b9aebb]">A multiplayer trivia battleground where every correct answer expands your domain. Read the field, outwit your rivals, and turn knowledge into a kingdom.</p>
          <div className="mt-9 flex flex-wrap gap-3"><Link href="/game" className="flex items-center gap-2 rounded-xl bg-[#d9b45a] px-6 py-3.5 font-bold text-[#1a1207] shadow-[0_10px_35px_rgba(217,180,90,.2)] hover:bg-[#f0ce76]"><Play size={18} fill="currentColor"/>Enter the arena<ArrowRight size={17}/></Link><button onClick={enterAuth} className="rounded-xl border border-white/12 bg-white/[.03] px-6 py-3.5 font-semibold text-[#e8dff1] hover:border-[#7e5cc7]/60 hover:bg-[#7e5cc7]/10">Create your legend</button></div>
          <div className="mt-10 flex items-center gap-4 text-xs text-[#8f8496]"><div className="flex -space-x-2">{['#c09dff','#e6c56d','#9e7fd8','#c67a7a'].map((color, i) => <div key={i} className="h-7 w-7 rounded-full border-2 border-[#0b0911]" style={{background: `radial-gradient(circle at 35% 30%, #fff, ${color} 25%, #271c38 70%)`}}/>)}</div><span><b className="text-[#eee2bb]">{stats[0].value}</b> scholars are in the realm</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-[570px] animate-rise [animation-delay:120ms]">
          <div className="absolute -inset-12 rounded-full bg-[#6943a2]/20 blur-3xl"/><div className="panel relative aspect-square overflow-hidden rounded-[2.5rem] border-[#d9b45a]/25 p-5 glow-gold"><div className="territory-map h-full rounded-[2rem] border border-white/5"><div className="absolute left-[18%] top-[23%] h-32 w-32 rounded-full bg-[#8b6fe3]/20 blur-2xl"/><div className="absolute right-[16%] top-[43%] h-28 w-28 rounded-full bg-[#d9b45a]/20 blur-2xl"/><div className="map-node violet left-[20%] top-[26%]">NORTH</div><div className="map-node right-[21%] top-[42%]">CROWN</div><div className="map-node violet bottom-[20%] left-[42%]">VALE</div><div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur"><div><div className="eyebrow">Live duel</div><div className="mt-1 text-sm font-semibold">The Astral Frontier</div></div><div className="text-right"><div className="text-xs text-[#a69ead]">Round 04</div><div className="font-display text-[#e3c36a]">02:14</div></div></div></div></div>
          <div className="panel absolute -bottom-4 -left-5 hidden rounded-2xl px-4 py-3 sm:block"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#7e5cc7]/20 text-[#bfa9ff]"><Swords size={17}/></div><div><div className="text-xs text-[#a69ead]">Territory seized</div><div className="text-sm font-bold text-white">The Ember Gate</div></div></div></div>
        </div>
      </section>
      <section className="grid gap-3 border-y border-white/8 py-6 sm:grid-cols-3">{stats.map(({label,value,delta,icon:Icon}) => <div key={label} className="flex items-center gap-4 px-3 py-2"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#171326] text-[#d9b45a]"><Icon size={18}/></div><div><div className="text-2xl font-semibold tracking-tight text-[#f7edcf]">{value}</div><div className="text-xs text-[#8f8496]">{label} <span className="ml-1 text-[#9e8bcd]">{delta}</span></div></div></div>)}</section>
      <section id="modes" className="py-24"><div className="mb-10 flex items-end justify-between"><div><div className="eyebrow">Choose your path</div><h2 className="mt-3 font-display text-3xl text-[#f7e7b0] sm:text-4xl">Three ways to conquer</h2></div><Link href="/game" className="hidden items-center gap-2 text-sm text-[#d9b45a] hover:text-white sm:flex">View arena <ArrowRight size={15}/></Link></div><div className="grid gap-4 md:grid-cols-3">{[{title:'Duo',tag:'1 · 1',desc:'A focused duel of wit, tempo, and territory.',tone:'violet',icon:Swords},{title:'Classic',tag:'4 · 8',desc:'A crowded battlefield where every answer shifts the map.',tone:'gold',icon:Eye},{title:'Blitz',tag:'90 sec',desc:'No time to hesitate. Speed is your sharpest spell.',tone:'rose',icon:Flame}].map(({title,tag,desc,tone,icon:Icon}) => <Link href="/game" key={title} className={`panel panel-hover group relative min-h-56 overflow-hidden rounded-2xl p-6 ${tone==='violet'?'hover:shadow-[#7e5cc7]/20':tone==='rose'?'hover:shadow-[#bf7187]/20':''}`}><div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#7e5cc7]/10 blur-2xl transition-transform group-hover:scale-150"/><div className="relative flex h-full flex-col justify-between"><div className="flex items-start justify-between"><div className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-[#d9b45a]"><Icon size={21}/></div><span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-[#a69ead]">{tag}</span></div><div><h3 className="font-display text-2xl text-[#f7e7b0]">{title}</h3><p className="mt-2 max-w-[230px] text-sm leading-6 text-[#9f94a8]">{desc}</p></div></div></Link>)}</div></section>
      <section id="hall" className="panel grid gap-8 rounded-3xl p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="eyebrow">The prestige hall</div><h2 className="mt-3 font-display text-3xl text-[#f7e7b0]">Every answer leaves a mark.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-[#a69ead]">Unlock achievements, equip rare badges, and build a showcase that tells the story of your rise from initiate to grand master.</p></div><Link href="/profile" className="flex items-center justify-center gap-2 rounded-xl border border-[#d9b45a]/30 px-5 py-3 text-sm font-semibold text-[#e3c36a] hover:bg-[#d9b45a]/10">View prestige hall <ArrowRight size={16}/></Link></section>
      <div className="flex items-center justify-between pt-14 text-xs text-[#6f6875]"><span>© 2026 QuizRealm</span><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#7e5cc7]"/>The realm is online</span></div>
    </div>
  </div>;
}
