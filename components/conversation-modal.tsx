"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ContactForm } from "./contact-form";
import { Eyebrow } from "./ui";

const ConversationContext = createContext<(() => void) | null>(null);

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);

  const showConversation = () => {
    trigger.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  };

  const closeConversation = () => {
    dialog.current?.close();
    setOpen(false);
  };

  useEffect(() => {
    const node = dialog.current;
    if (!open || !node) return;
    node.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      if (node.open) node.close();
      trigger.current?.focus();
    };
  }, [open]);

  return (
    <ConversationContext.Provider value={showConversation}>
      {children}
      {open && (
        <dialog
          ref={dialog}
          className="conversation-modal"
          aria-labelledby="conversation-modal-title"
          onCancel={(event) => {
            event.preventDefault();
            closeConversation();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeConversation();
          }}
        >
          <div className="conversation-modal-panel">
            <button
              className="conversation-modal-close"
              type="button"
              onClick={closeConversation}
              aria-label="Close conversation form"
            >
              Close <span aria-hidden="true">×</span>
            </button>
            <header>
              <Eyebrow>Begin a conversation</Eyebrow>
              <h2 id="conversation-modal-title">Tell us about your opportunity.</h2>
              <p>Share a few details and our team will be in touch within 24 hours.</p>
            </header>
            <ContactForm />
          </div>
        </dialog>
      )}
    </ConversationContext.Provider>
  );
}

export function ConversationTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const showConversation = useContext(ConversationContext);
  if (!showConversation) throw new Error("ConversationTrigger must be used inside ConversationProvider.");

  return (
    <button
      className={`conversation-trigger${className ? ` ${className}` : ""}`}
      type="button"
      onClick={showConversation}
    >
      {children}
    </button>
  );
}
