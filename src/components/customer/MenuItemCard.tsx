"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { ICustomizationGroup } from "@/models/MenuItem";

export interface MenuItemCardProps {
  item: {
    _id: string;
    branchId: string;
    title: string;
    description: string;
    price: number;
    category: string;
    imageUrl: string;
    inStock: boolean;
    customizationGroups?: ICustomizationGroup[];
  };
  onSelect: (item: MenuItemCardProps["item"]) => void;
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  const hasCustomizations =
    item.customizationGroups && item.customizationGroups.length > 0;

  return (
    <div
      id={`menu-item-${item._id}`}
      onClick={() => item.inStock && onSelect(item)}
      className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 sm:flex-row sm:gap-4 ${
        item.inStock
          ? "hover:border-orange-400 hover:shadow-md active:scale-[0.99]"
          : "opacity-60 cursor-not-allowed bg-slate-50"
      }`}
    >
      <div className="flex flex-1 flex-col justify-between pr-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition">
              {item.title}
            </h4>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {item.description}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold text-slate-900">
              ₦{item.price.toLocaleString()}
            </span>
            {hasCustomizations && (
              <span className="text-[11px] font-medium text-slate-400">
                + options
              </span>
            )}
          </div>

          {!item.inStock && (
            <span className="rounded bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">
              Out of stock
            </span>
          )}
        </div>
      </div>

      {/* Item Image with Add Action Button */}
      <div className="relative mt-3 h-28 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:mt-0 sm:h-28 sm:w-28">
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, 120px"
          className="object-cover transition duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {item.inStock && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            aria-label={`Customize ${item.title}`}
            className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-md transition hover:bg-orange-600 active:scale-90"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
          </button>
        )}
      </div>
    </div>
  );
}
