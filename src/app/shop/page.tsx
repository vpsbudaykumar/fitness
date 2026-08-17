"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";

type Category =
  | "All"
  | "Equipment"
  | "Recovery"
  | "Accessories";

type Product = {
  id: number;
  name: string;
  category: Exclude<Category, "All">;
  description: string;
  price: string;
  tag?: string;
  icon: string;
};

const products: Product[] = [
  {
    id: 1,
    name: "Resistance Bands",
    category: "Equipment",
    description:
      "Versatile bands for strength, mobility, and warm-ups.",
    price: "₹799",
    tag: "Popular",
    icon: "◒",
  },
  {
    id: 2,
    name: "Adjustable Dumbbells",
    category: "Equipment",
    description:
      "Compact adjustable weights for progressive strength training.",
    price: "₹2,499",
    tag: "Strength",
    icon: "◆",
  },
  {
    id: 3,
    name: "Yoga Mat",
    category: "Equipment",
    description:
      "Cushioned training surface for mobility and floor exercises.",
    price: "₹999",
    icon: "▰",
  },
  {
    id: 4,
    name: "Foam Roller",
    category: "Recovery",
    description:
      "Useful for post-workout recovery and mobility work.",
    price: "₹899",
    tag: "Recovery",
    icon: "◉",
  },
  {
    id: 5,
    name: "Massage Ball",
    category: "Recovery",
    description:
      "Compact tool for targeted recovery and muscle release.",
    price: "₹399",
    icon: "●",
  },
  {
    id: 6,
    name: "Training Bottle",
    category: "Accessories",
    description:
      "Reusable bottle to keep hydration close during training.",
    price: "₹599",
    icon: "▯",
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

  const filteredProducts =
    category === "All"
      ? products
      : products.filter(
          (product) =>
            product.category === category
        );

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <p className="eyebrow">
          Training essentials
        </p>

        <h1 className="page-title mt-1">
          Shop
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
          Equipment and recovery essentials selected to
          support your training.
        </p>

        <div className="mt-7 flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => {
            const active = category === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-[#3D5AFE] bg-[#3D5AFE]/15 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#232837] transition hover:-translate-y-1 hover:border-[#3D5AFE]/40"
            >
              <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-[#2A3040] to-[#1B1F29]">
                <span className="font-[Space_Grotesk] text-6xl font-bold text-white/10 transition group-hover:text-[#3D5AFE]/30">
                  {product.icon}
                </span>

                {product.tag && (
                  <span className="absolute left-4 top-4 rounded-full bg-[#3D5AFE]/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8FA0FF]">
                    {product.tag}
                  </span>
                )}
              </div>

              <div className="p-5">
                <p className="eyebrow">
                  {product.category}
                </p>

                <h2 className="mt-2 font-[Space_Grotesk] text-xl font-bold">
                  {product.name}
                </h2>

                <p className="mt-2 min-h-10 text-sm leading-5 text-white/50">
                  {product.description}
                </p>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="metric text-lg font-semibold">
                    {product.price}
                  </span>

                  <button
                    type="button"
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#3D5AFE]/40 hover:bg-[#3D5AFE]/10"
                    onClick={() => {
                      alert(
                        `${product.name} will be available soon.`
                      );
                    }}
                  >
                    View product
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="card mt-6">
          <p className="eyebrow">
            Coming next
          </p>

          <h2 className="mt-2 font-[Space_Grotesk] text-xl font-bold">
            Personalized recommendations
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
            FORM//COACH can eventually recommend equipment
            based on your workout plan, goals, training
            location, and the equipment you already own.
          </p>
        </section>
      </div>
    </AppShell>
  );
}