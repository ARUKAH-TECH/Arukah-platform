"use client";

import { useActionState } from "react";
import { updateBookOrder } from "@/features/admin/cms/bookOrderActions";
import { initialCmsFormState } from "@/features/admin/cms/shared";
import { fieldClasses, primaryButtonClasses } from "@/features/admin/ui";

export interface BookOrderFormValues {
  id: string;
  status: string;
  paymentStatus: string;
  amountPaid: string;
  deliveryFee: string;
  paymentReference: string;
  adminNote: string;
  hasPrint: boolean;
}

const STEPS = [
  { value: "new", label: "New" },
  { value: "paid", label: "Paid" },
  { value: "printing", label: "Printing" },
  { value: "ready", label: "Ready to collect" },
  { value: "shipped", label: "Sent out" },
  { value: "delivered", label: "Delivered / done" },
  { value: "cancelled", label: "Cancelled" },
];

export function BookOrderForm({ values }: { values: BookOrderFormValues }) {
  const [state, formAction, pending] = useActionState(updateBookOrder, initialCmsFormState);
  return (
    <form action={formAction} className="flex flex-col gap-5 text-sm">
      <input type="hidden" name="id" value={values.id} />
      <label className="font-medium">
        Progress
        <select name="status" defaultValue={values.status} className={fieldClasses}>
          {STEPS.filter((step) => values.hasPrint || !["printing", "ready", "shipped"].includes(step.value)).map((step) => (
            <option key={step.value} value={step.value}>
              {step.label}
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend className="font-medium">Payment</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {[
            { value: "unpaid", label: "Not paid" },
            { value: "part", label: "Part paid" },
            { value: "full", label: "Full paid" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input type="radio" name="paymentStatus" value={option.value} defaultChecked={values.paymentStatus === option.value} />
              {option.label}
            </label>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            Amount paid (GHS)
            <input name="amountPaid" inputMode="decimal" defaultValue={values.amountPaid} className={fieldClasses} />
          </label>
          <label>
            Reference <span className="text-foreground/50">(MoMo / bank)</span>
            <input name="paymentReference" maxLength={200} defaultValue={values.paymentReference} className={fieldClasses} />
          </label>
        </div>
      </fieldset>

      {values.hasPrint && (
        <label>
          Delivery charge (GHS) <span className="text-foreground/50">(added to the total)</span>
          <input name="deliveryFee" inputMode="decimal" defaultValue={values.deliveryFee} className={`${fieldClasses} max-w-[10rem]`} />
        </label>
      )}

      <label>
        Private note
        <textarea name="adminNote" rows={2} maxLength={2000} defaultValue={values.adminNote} className={fieldClasses} />
      </label>

      {state.status !== "idle" && (
        <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}>
          {state.message}
        </p>
      )}
      <div>
        <button type="submit" disabled={pending} className={primaryButtonClasses}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
