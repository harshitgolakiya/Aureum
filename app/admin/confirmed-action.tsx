"use client";

export function ConfirmedAction({
  action,
  slug,
  operation,
  confirmMessage,
  danger = false,
  fields,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  slug: string;
  operation: string;
  confirmMessage?: string;
  danger?: boolean;
  fields?: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="operation" value={operation} />
      {Object.entries(fields ?? {}).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <button className={danger ? "is-danger" : ""} type="submit">{children}</button>
    </form>
  );
}
