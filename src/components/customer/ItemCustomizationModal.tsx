"use client";

import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { Check, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { ICustomizationGroup } from "@/models/MenuItem";
import { toast } from "sonner";

export interface CustomizationItemData {
  _id: string;
  branchId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  inStock: boolean;
  customizationGroups?: ICustomizationGroup[];
}

interface ItemCustomizationModalProps {
  item: CustomizationItemData | null;
  isOpen: boolean;
  onClose: () => void;
}

function ItemCustomizationForm({
  item,
  onClose,
}: {
  item: CustomizationItemData;
  onClose: () => void;
}) {
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);

  // Initialize selected options map from required groups
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(() => {
    const initialSelections: Record<string, string[]> = {};
    item.customizationGroups?.forEach((group) => {
      if (group.required && group.options.length > 0) {
        initialSelections[group.groupName] = [group.options[0].name];
      } else {
        initialSelections[group.groupName] = [];
      }
    });
    return initialSelections;
  });

  // Calculate unit price including options
  const unitPrice = useMemo(() => {
    let total = item.price;
    item.customizationGroups?.forEach((group) => {
      const selectedNames = selectedOptions[group.groupName] || [];
      group.options.forEach((opt) => {
        if (selectedNames.includes(opt.name)) {
          total += opt.extraPrice;
        }
      });
    });
    return total;
  }, [item, selectedOptions]);

  const totalPrice = unitPrice * quantity;

  // Validation: check if all required groups have at least 1 selection
  const isFormValid = useMemo(() => {
    if (!item.customizationGroups) return true;
    return item.customizationGroups.every((group) => {
      if (!group.required) return true;
      const selections = selectedOptions[group.groupName] || [];
      return selections.length > 0;
    });
  }, [item, selectedOptions]);

  const handleOptionToggle = (
    group: ICustomizationGroup,
    optionName: string,
    isSingleChoice: boolean,
  ) => {
    setSelectedOptions((prev) => {
      const current = prev[group.groupName] || [];

      if (isSingleChoice || group.required) {
        return {
          ...prev,
          [group.groupName]: [optionName],
        };
      }

      if (current.includes(optionName)) {
        return {
          ...prev,
          [group.groupName]: current.filter((name) => name !== optionName),
        };
      } else {
        return {
          ...prev,
          [group.groupName]: [...current, optionName],
        };
      }
    });
  };

  const handleAddToCart = () => {
    if (!isFormValid) {
      toast.error("Please select all required options");
      return;
    }

    const selectedOptionsList: string[] = [];
    Object.values(selectedOptions).forEach((names) => {
      names.forEach((name) => selectedOptionsList.push(name));
    });

    const optionsKey = selectedOptionsList.sort().join("|");
    const cartItemId = optionsKey ? `${item._id}-${optionsKey}` : item._id;
    const formattedTitle =
      selectedOptionsList.length > 0
        ? `${item.title} (${selectedOptionsList.join(", ")})`
        : item.title;

    addItem({
      id: cartItemId,
      menuItemId: cartItemId,
      title: formattedTitle,
      quantity,
      unitPrice,
      imageUrl: item.imageUrl,
    });

    toast.success(`Added ${quantity}x ${item.title} to cart`);
    onClose();
  };

  return (
    <>
      {/* Hero Header with Item Image & Close */}
      <div className="relative h-56 w-full shrink-0 bg-slate-100">
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/30" />

        <Dialog.Close asChild>
          <button
            type="button"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </Dialog.Close>

        <div className="absolute bottom-4 left-5 right-5 text-white">
          <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
            {item.category}
          </span>
          <Dialog.Title className="mt-1 text-xl font-extrabold tracking-tight">
            {item.title}
          </Dialog.Title>
          <p className="line-clamp-2 text-xs text-slate-200 mt-0.5">
            {item.description}
          </p>
        </div>
      </div>

      {/* Scrollable Customization Body */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
        {item.customizationGroups && item.customizationGroups.length > 0 ? (
          item.customizationGroups.map((group) => {
            const isSingle = group.required;
            const currentSelected = selectedOptions[group.groupName] || [];

            return (
              <div key={group.groupName} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {group.groupName}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {group.required ? "Select 1 option (Required)" : "Optional extras"}
                    </p>
                  </div>
                  {group.required ? (
                    <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                      REQUIRED
                    </span>
                  ) : (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      OPTIONAL
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {group.options.map((option) => {
                    const isChecked = currentSelected.includes(option.name);

                    return (
                      <button
                        key={option.name}
                        type="button"
                        onClick={() =>
                          handleOptionToggle(group, option.name, isSingle)
                        }
                        className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                          isChecked
                            ? "border-orange-500 bg-orange-50/50 shadow-sm"
                            : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-${
                              isSingle ? "full" : "md"
                            } border transition ${
                              isChecked
                                ? "border-orange-500 bg-orange-500 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-semibold text-slate-800">
                            {option.name}
                          </span>
                        </div>

                        <span className="text-xs font-bold text-slate-700">
                          {option.extraPrice === 0
                            ? "Free"
                            : `+₦${option.extraPrice.toLocaleString()}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">
            No extra customizations required for this item.
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions & Price Calculation */}
      <div className="border-t border-slate-100 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          {/* Quantity Counter */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-bold text-slate-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Add To Cart CTA */}
          <button
            type="button"
            id="add-to-cart-button"
            onClick={handleAddToCart}
            disabled={!isFormValid}
            className="flex flex-1 items-center justify-between rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 active:scale-[0.99] disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Add to Cart</span>
            </div>
            <span className="font-extrabold">₦{totalPrice.toLocaleString()}</span>
          </button>
        </div>
      </div>
    </>
  );
}

export function ItemCustomizationModal({
  item,
  isOpen,
  onClose,
}: ItemCustomizationModalProps) {
  if (!item) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl border border-slate-100 bg-white shadow-2xl focus:outline-none overflow-hidden">
          <ItemCustomizationForm
            key={item._id}
            item={item}
            onClose={onClose}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
