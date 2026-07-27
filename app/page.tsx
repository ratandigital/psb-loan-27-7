// app/page.jsx
import Link from "next/link";

const stats = [
  { number: "১২টি", label: "ফাইল সংরক্ষণ" },
  { number: "স্বয়ংক্রিয়", label: "দৈনিক চেক" },
  { number: "তাৎক্ষণিক", label: "Email নোটিফিকেশন" },
  { number: "১০০%", label: "নির্ভরযোগ্য" },
];

const features = [
  {
    icon: "📂",
    step: "০১",
    title: "ফাইল আপলোড",
    desc: "প্রতি মাসে Employee List সহ Excel ফাইল আপলোড করুন। তারিখসহ সংরক্ষিত হবে।",
  },
  {
    icon: "🔍",
    step: "০২",
    title: "স্বয়ংক্রিয় ফিল্টার",
    desc: "প্রতিদিন সকালে ১ বছর আগের ঋণ বিতরণের তারিখ খুঁজে Field Assistant ভিত্তিক গ্রুপ করে।",
  },
  {
    icon: "📧",
    step: "০৩",
    title: "Email নোটিফিকেশন",
    desc: "সংশ্লিষ্ট Field Assistant কে Member তালিকাসহ সুন্দর Email পাঠানো হয়।",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">

      {/* ── Hero ── */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          স্বয়ংক্রিয় ঋণ ব্যবস্থাপনা সিস্টেম
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
          ঋণ নবায়নের
          <br />
          <span className="text-yellow-400 drop-shadow-lg">
            স্মার্ট রিমাইন্ডার
          </span>
        </h1>

        {/* Sub-text */}
        <p className="text-white/70 text-lg max-w-2xl mb-10 leading-relaxed">
          Excel ফাইল আপলোড করুন, স্বয়ংক্রিয়ভাবে ঋণ নবায়নের তারিখ ট্র্যাক
          করুন এবং Field Assistant দের সময়মতো Email নোটিফিকেশন পাঠান।
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/upload"
            className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg"
          >
            📂 ফাইল আপলোড করুন
          </Link>

          <Link
            href="/dashboard"
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg transition backdrop-blur-sm"
          >
            📊 ড্যাশবোর্ড দেখুন
          </Link>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center hover:bg-white/15 transition"
            >
              <p className="text-3xl font-bold text-yellow-400">
                {stat.number}
              </p>
              <p className="text-white/70 text-sm mt-2">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto w-full px-6 pb-20">
        <h2 className="text-3xl font-bold text-white text-center mb-14">
          কীভাবে কাজ করে?
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-4xl">{feature.icon}</span>
                <span className="text-white/30 font-bold text-3xl">
                  {feature.step}
                </span>
              </div>

              <h3 className="text-white font-bold text-xl mb-3">
                {feature.title}
              </h3>

              <p className="text-white/60 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="max-w-4xl mx-auto w-full px-6 pb-20">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-10 text-center">
          <h3 className="text-white font-bold text-2xl mb-3">
            এখনই শুরু করুন
          </h3>
          <p className="text-white/60 mb-6">
            আপনার প্রথম Excel ফাইল আপলোড করুন এবং সিস্টেম সেটআপ করুন।
          </p>

          <Link
            href="/upload"
            className="inline-block bg-yellow-400 hover:bg-yellow-300 text-blue-900 px-8 py-3 rounded-xl font-bold transition shadow-lg"
          >
            শুরু করুন →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-white/10 py-6 text-center text-white/40 text-sm">
        © {new Date().getFullYear()} LoanTrack — স্বয়ংক্রিয় ঋণ ব্যবস্থাপনা সিস্টেম
      </footer>
    </div>
  );
}