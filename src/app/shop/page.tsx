"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Dumbbell,
  HeartPulse,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";

type Category =
  | "All"
  | "Equipment"
  | "Recovery"
  | "Accessories";

type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  category: Exclude<Category, "All">;
  badge?: string;
  icon: typeof Dumbbell;
  accent: string;
};

const products: Product[] = [
  {
    id: 1,
    name: "Resistance Bands",
    description:
      "Versatile bands for strength, mobility, and warm-ups.",
    price: "₹799",
    category: "Equipment",
    badge: "Popular",
    icon: Dumbbell,
    accent: "#08A6A6",
  },
  {
    id: 2,
    name: "Adjustable Dumbbells",
    description:
      "Compact adjustable weights for progressive strength training.",
    price: "₹2,499",
    category: "Equipment",
    badge: "Strength",
    icon: Dumbbell,
    accent: "#7657F6",
  },
  {
    id: 3,
    name: "Yoga Mat",
    description:
      "Cushioned training surface for mobility and floor exercises.",
    price: "₹999",
    category: "Equipment",
    icon: Dumbbell,
    accent: "#08A6A6",
  },
  {
    id: 4,
    name: "Foam Roller",
    description:
      "Useful for post-workout recovery and mobility work.",
    price: "₹899",
    category: "Recovery",
    badge: "Recovery",
    icon: HeartPulse,
    accent: "#FF735C",
  },
  {
    id: 5,
    name: "Massage Ball",
    description:
      "Compact tool for targeted recovery and muscle release.",
    price: "₹399",
    category: "Recovery",
    icon: HeartPulse,
    accent: "#7657F6",
  },
  {
    id: 6,
    name: "Training Bottle",
    description:
      "Reusable bottle to keep hydration close during training.",
    price: "₹599",
    category: "Accessories",
    icon: ShoppingBag,
    accent: "#08A6A6",
  },
];

const categories: Category[] = [
  "All",
  "Equipment",
  "Recovery",
  "Accessories",
];

export default function ShopPage() {
  const [category, setCategory] =
    useState<Category>("All");

  const filteredProducts = useMemo(() => {
    if (category === "All") {
      return products;
    }

    return products.filter(
      (product) => product.category === category
    );
  }, [category]);

  return (
    <AppShell>
      <main className="pb-10">
        {/* =================================================
            HEADER
        ================================================= */}

        <section className="home-greeting">
          <p className="eyebrow">
            Training essentials
          </p>

          <h1 className="page-title mt-2">
            Shop
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-[#66727F]">
            Equipment and recovery essentials selected
            to support your training.
          </p>
        </section>

        {/* =================================================
            FEATURED BANNER
        ================================================= */}

        <section className="relative overflow-hidden rounded-3xl border border-[#E7ECEA] bg-white p-6 shadow-sm sm:p-8">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#08A6A6]/10"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-24 right-24 h-44 w-44 rounded-full bg-[#7657F6]/10"
          />

          <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#08A6A6]/10">
                  <Sparkles
                    size={18}
                    className="text-[#08A6A6]"
                  />
                </span>

                <span className="eyebrow">
                  Train smarter
                </span>
              </div>

              <h2 className="mt-4 max-w-xl font-[Space_Grotesk] text-2xl font-bold tracking-tight text-[#17212B] sm:text-3xl">
                Build your training setup
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#66727F]">
                Find simple equipment and recovery
                tools that can complement your
                FORM//COACH training plan.
              </p>
            </div>

            <div className="hidden h-28 w-28 items-center justify-center rounded-3xl bg-[#F1F6F5] sm:flex">
              <Dumbbell
                size={48}
                strokeWidth={1.3}
                className="text-[#08A6A6]"
              />
            </div>
          </div>
        </section>

        {/* =================================================
            CATEGORY FILTER
        ================================================= */}

        <section className="mt-8">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => {
              const active = category === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "border-[#08A6A6] bg-[#08A6A6] text-white shadow-sm"
                      : "border-[#E7ECEA] bg-white text-[#66727F] hover:border-[#08A6A6]/30 hover:bg-[#F1F6F5] hover:text-[#078B8B]"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </section>

        {/* =================================================
            PRODUCTS
        ================================================= */}

        <section className="mt-5">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="eyebrow">
                Essentials
              </p>

              <h2 className="mt-1 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                {category === "All"
                  ? "Recommended essentials"
                  : category}
              </h2>
            </div>

            <span className="text-xs text-[#9AA5AF]">
              {filteredProducts.length} items
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => {
              const Icon = product.icon;

              return (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-2xl border border-[#E7ECEA] bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#08A6A6]/25 hover:shadow-md"
                >
                  {/* Product visual */}

                  <div
                    className="relative flex h-44 items-center justify-center overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${product.accent}12, ${product.accent}04)`,
                    }}
                  >
                    <div
                      className="absolute -right-8 -top-8 h-28 w-28 rounded-full"
                      style={{
                        backgroundColor: `${product.accent}12`,
                      }}
                    />

                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm"
                      style={{
                        color: product.accent,
                      }}
                    >
                      <Icon
                        size={38}
                        strokeWidth={1.4}
                      />
                    </div>

                    {product.badge && (
                      <span
                        className="absolute left-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                        style={{
                          backgroundColor: `${product.accent}14`,
                          color: product.accent,
                        }}
                      >
                        {product.badge}
                      </span>
                    )}
                  </div>

                  {/* Product information */}

                  <div className="p-5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9AA5AF]">
                      {product.category}
                    </div>

                    <h3 className="mt-2 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                      {product.name}
                    </h3>

                    <p className="mt-2 min-h-[48px] text-sm leading-6 text-[#66727F]">
                      {product.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="metric text-lg font-bold text-[#17212B]">
                        {product.price}
                      </span>

                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7ECEA] bg-[#F7FAF9] px-3 py-2 text-xs font-semibold text-[#17212B] transition hover:border-[#08A6A6]/30 hover:bg-[#F1F6F5] hover:text-[#078B8B]"
                      >
                        View product
                        <ArrowRight
                          size={14}
                          className="transition group-hover:translate-x-0.5"
                        />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* =================================================
            PERSONALIZED RECOMMENDATIONS
        ================================================= */}

        <section className="mt-10 rounded-2xl border border-dashed border-[#D7DFDC] bg-white p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7657F6]/10">
              <Sparkles
                size={20}
                className="text-[#7657F6]"
              />
            </div>

            <div>
              <p className="eyebrow text-[#7657F6]">
                Coming next
              </p>

              <h2 className="mt-2 font-[Space_Grotesk] text-lg font-bold text-[#17212B]">
                Personalized recommendations
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#66727F]">
                FORM//COACH can eventually recommend
                equipment based on your workout plan,
                goals, training location, and the
                equipment you already own.
              </p>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}