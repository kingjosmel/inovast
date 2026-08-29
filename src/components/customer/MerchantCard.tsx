"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, Motorbike, Star } from "lucide-react";

export interface MerchantCardProps {
  id?: string;
  name: string;
  slug: string;
  logoUrl?: string;
  coverImageUrl: string;
  deliveryFee: number;
  rating?: number;
  ratingCount?: number;
  deliveryTime?: string;
  isOpen: boolean;
  categories?: string[];
  area?: string;
}

export function MerchantCard({
  name,
  slug,
  logoUrl,
  coverImageUrl,
  deliveryFee,
  rating = 4.8,
  ratingCount = 120,
  deliveryTime = "25-35 min",
  isOpen,
  categories = [],
  area,
}: MerchantCardProps) {
  const formattedFee = deliveryFee === 0 ? "Free delivery" : `₦${deliveryFee.toLocaleString()}`;

  return (
    <Link
      href={`/merchant/${slug}`}
      id={`merchant-card-${slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
        <Image
          src={coverImageUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition duration-300 group-hover:scale-105 ${
            !isOpen ? "grayscale opacity-80" : ""
          }`}
          referrerPolicy="no-referrer"
        />

        {/* Status Badge */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide shadow-sm backdrop-blur-md ${
              isOpen
                ? "bg-emerald-500/90 text-white"
                : "bg-slate-900/80 text-slate-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isOpen ? "bg-white animate-pulse" : "bg-slate-400"
              }`}
            />
            {isOpen ? "Open" : "Closed"}
          </span>

          {area && (
            <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
              {area}
            </span>
          )}
        </div>

        {/* Delivery Time Badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-md">
          <Clock className="h-3.5 w-3.5 text-orange-500" />
          <span>{deliveryTime}</span>
        </div>

        {/* Logo Overlay */}
        {logoUrl && (
          <div className="absolute -bottom-3 left-3 h-10 w-10 overflow-hidden rounded-xl border-2 border-white bg-white shadow-md">
            <Image
              src={logoUrl}
              alt={`${name} logo`}
              width={40}
              height={40}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>

      {/* Details Container */}
      <div className="flex flex-1 flex-col p-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-base font-bold text-slate-900 group-hover:text-orange-600">
            {name}
          </h3>
          <div className="flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-700">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{rating.toFixed(1)}</span>
            <span className="text-[10px] font-normal text-amber-600/80">({ratingCount})</span>
          </div>
        </div>

        {/* Categories / Tags */}
        {categories.length > 0 && (
          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
            {categories.join(" • ")}
          </p>
        )}

        {/* Delivery Fee & Info */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Motorbike className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800">{formattedFee}</span>
          </div>
          <span className="text-xs font-semibold text-orange-600 group-hover:underline">
            View Menu →
          </span>
        </div>
      </div>
    </Link>
  );
}
