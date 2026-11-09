import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: (id: string) => ReactNode;
}

/** Label + control + error message with correct aria wiring. */
export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId();
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {required && <span className="text-coral-500 ml-0.5">*</span>}
        </label>
      )}
      {children(id)}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-coral-600 mt-1.5 text-[13px] font-medium"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="text-ink-500 mt-1.5 text-[13px]">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, wrapperClassName, required, ...props },
  ref,
) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      {(id) => (
        <input
          ref={ref}
          id={props.id ?? id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn("field", error && "field-error", className)}
          {...props}
        />
      )}
    </Field>
  );
});

/** Classes a native <select> inside a SelectFrame needs: hide the browser arrow and drive the chevron's states. */
export const selectClass = "select-base peer cursor-pointer appearance-none";

/**
 * Wraps a native <select> and draws the Tripnaro chevron (lucide ChevronDown) over its right edge.
 * The select keeps native keyboard and mobile pickers; the icon ignores pointer events so clicks reach it.
 * Give the select `selectClass` and enough right padding for the icon.
 */
export function SelectFrame({
  children,
  className,
  iconClassName,
}: {
  children: ReactNode;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {children}
      <ChevronDown
        aria-hidden
        className={cn(
          "text-ink-500 peer-hover:text-ink-700 peer-focus:text-brand-600 pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 transition peer-disabled:opacity-40",
          iconClassName,
        )}
      />
    </div>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className, wrapperClassName, options, placeholder, required, ...props },
  ref,
) {
  return (
    <Field label={label} error={error} required={required} className={wrapperClassName}>
      {(id) => (
        <SelectFrame>
          <select
            ref={ref}
            id={props.id ?? id}
            aria-invalid={!!error}
            className={cn("field pr-10", selectClass, error && "field-error", className)}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </SelectFrame>
      )}
    </Field>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, wrapperClassName, required, ...props },
  ref,
) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      {(id) => (
        <textarea
          ref={ref}
          id={props.id ?? id}
          aria-invalid={!!error}
          className={cn("field h-auto min-h-24 py-2.5", error && "field-error", className)}
          {...props}
        />
      )}
    </Field>
  );
});

export const Checkbox = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }
>(function Checkbox({ label, className, ...props }, ref) {
  return (
    <label
      className={cn(
        "text-ink-700 flex cursor-pointer items-center gap-2.5 text-sm select-none",
        className,
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        className="border-ink-300 accent-brand-600 size-4 shrink-0 rounded"
        {...props}
      />
      <span className="min-w-0">{label}</span>
    </label>
  );
});
