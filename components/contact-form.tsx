"use client";

import { FormEvent, useRef, useState } from "react";

type Values = {
  name: string;
  organisation: string;
  role: string;
  email: string;
  phone: string;
  interest: string;
  opportunity: string;
  source: string;
};
type Errors = Partial<Record<keyof Values, string>>;
const initial: Values = {
  name: "",
  organisation: "",
  role: "",
  email: "",
  phone: "",
  interest: "",
  opportunity: "",
  source: "",
};

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (values.name.trim().length < 2)
    errors.name = "Please enter your full name.";
  if (values.organisation.trim().length < 2)
    errors.organisation = "Please enter your organisation.";
  if (values.role.trim().length < 2)
    errors.role = "Please enter your role or position.";
  if (!/^\S+@\S+\.\S+$/.test(values.email))
    errors.email = "Please enter a valid email address.";
  if (values.phone && !/^[+\d\s()-]{7,}$/.test(values.phone))
    errors.phone =
      "Please enter a valid phone number or leave this field empty.";
  if (!values.interest) errors.interest = "Please select an area of interest.";
  return errors;
}

async function submitConversation(
  values: Values,
): Promise<{ ok: boolean; configured: boolean }> {
  const endpoint = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT;
  if (!endpoint) return { ok: false, configured: false };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  return { ok: response.ok, configured: true };
}

const fields = [
  {
    name: "name" as const,
    label: "Full Name",
    type: "text",
    required: true,
    autoComplete: "name",
  },
  {
    name: "organisation" as const,
    label: "Organisation",
    type: "text",
    required: true,
    autoComplete: "organization",
  },
  {
    name: "role" as const,
    label: "Role / Position",
    type: "text",
    required: true,
    autoComplete: "organization-title",
  },
  {
    name: "email" as const,
    label: "Email Address",
    type: "email",
    required: true,
    autoComplete: "email",
  },
  {
    name: "phone" as const,
    label: "Phone",
    type: "tel",
    required: false,
    autoComplete: "tel",
  },
];

export function ContactForm() {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "unconfigured" | "failed"
  >("idle");
  const summary = useRef<HTMLDivElement>(null);
  function update(name: keyof Values, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name])
      setErrors((current) => ({ ...current, [name]: undefined }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const next = validate(values);
    setErrors(next);
    if (Object.keys(next).length) {
      setTimeout(() => summary.current?.focus(), 0);
      return;
    }
    setStatus("sending");
    try {
      const result = await submitConversation(values);
      setStatus(
        result.ok ? "success" : result.configured ? "failed" : "unconfigured",
      );
    } catch {
      setStatus("failed");
    }
  }
  if (status === "success")
    return (
      <div className="confirmation success" role="status">
        <div className="confirmation-mark">
          <i />
          <i />
        </div>
        <small>Conversation received</small>
        <h2>Thank you.</h2>
        <p>
          A member of our team will be in touch within 24 hours to begin the
          conversation.
        </p>
      </div>
    );
  return (
    <form className="strategic-form" onSubmit={submit} noValidate>
      {Object.keys(errors).length > 0 && (
        <div ref={summary} className="error-summary" role="alert" tabIndex={-1}>
          <strong>Please review the highlighted fields.</strong>
          <ul>
            {Object.entries(errors).map(([name, message]) => (
              <li key={name}>
                <a href={`#${name}`}>{message}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {fields.map((field) => (
        <label
          className={`field ${values[field.name] ? "has-value" : ""} ${errors[field.name] ? "invalid" : ""}`}
          key={field.name}
          htmlFor={field.name}
        >
          <span>
            {field.label}
            {field.required && " *"}
          </span>
          <input
            id={field.name}
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            value={values[field.name]}
            onChange={(event) => update(field.name, event.target.value)}
            aria-invalid={!!errors[field.name]}
            aria-describedby={
              errors[field.name] ? `${field.name}-error` : undefined
            }
          />
          {errors[field.name] && (
            <small id={`${field.name}-error`}>{errors[field.name]}</small>
          )}
        </label>
      ))}
      <label
        className={`field ${values.interest ? "has-value" : ""} ${errors.interest ? "invalid" : ""}`}
        htmlFor="interest"
      >
        <span>Area of Interest *</span>
        <select
          id="interest"
          value={values.interest}
          onChange={(event) => update("interest", event.target.value)}
          aria-invalid={!!errors.interest}
          aria-describedby={errors.interest ? "interest-error" : undefined}
        >
          <option value="">Select one</option>
          <option>Industrial Investment</option>
          <option>Development Management</option>
          <option>Strategic Partnership</option>
          <option>Land Development</option>
          <option>Market Intelligence</option>
          <option>Other</option>
        </select>
        {errors.interest && (
          <small id="interest-error">{errors.interest}</small>
        )}
      </label>
      <label
        className={`field full ${values.opportunity ? "has-value" : ""}`}
        htmlFor="opportunity"
      >
        <span>Tell us about your opportunity</span>
        <textarea
          id="opportunity"
          rows={4}
          value={values.opportunity}
          onChange={(event) => update("opportunity", event.target.value)}
        />
        <small className="character-count">
          {values.opportunity.length} characters
        </small>
      </label>
      <label
        className={`field full ${values.source ? "has-value" : ""}`}
        htmlFor="source"
      >
        <span>How did you hear about Aureum?</span>
        <select
          id="source"
          value={values.source}
          onChange={(event) => update("source", event.target.value)}
        >
          <option value="">Select one</option>
          <option>Referral</option>
          <option>Search</option>
          <option>Event</option>
          <option>Other</option>
        </select>
      </label>
      <div className="form-actions">
        <button
          type="submit"
          disabled={status === "sending"}
          aria-busy={status === "sending"}
        >
          {status === "sending" && <i className="button-spinner" />}
          {status === "sending" ? "Preparing…" : "Start the Conversation"}
          <span>↗</span>
        </button>
        <p>Required fields are marked with an asterisk.</p>
      </div>
      {status === "unconfigured" && (
        <div className="submission-notice" role="status">
          <strong>Your details are valid, but no message was sent.</strong>
          <p>
            The secure form endpoint has not yet been connected. Add{" "}
            <code>NEXT_PUBLIC_CONTACT_ENDPOINT</code> to enable live submission.
          </p>
        </div>
      )}
      {status === "failed" && (
        <div className="submission-notice error" role="alert">
          <strong>We couldn&apos;t send your message.</strong>
          <p>
            Please try again later or contact Aureum directly once official
            contact details are supplied.
          </p>
        </div>
      )}
    </form>
  );
}
