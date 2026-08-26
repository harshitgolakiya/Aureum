import { ContactMotion } from "@/components/contact-experience";
import { ContactForm } from "@/components/contact-form";
import { Eyebrow } from "@/components/ui";
import Image from "next/image";
import { getCmsContent } from "@/lib/cms/content";
export const metadata = {
  title: "Contact",
  description:
    "Start a conversation with Aureum about industrial development, investment, expansion or strategic partnership opportunities.",
  alternates: { canonical: "/contact" },
};
export default async function Page() {
  const contact = await getCmsContent("site.footer");
  const officeAddress = [
    contact.addressTwo,
    contact.addressThree,
    contact.addressFour,
    contact.addressFive,
  ].filter(Boolean).map((line) => line.trim().replace(/,\s*$/, "")).join(", ");
  const encodedOfficeAddress = encodeURIComponent(officeAddress);
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodedOfficeAddress}&output=embed`;
  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodedOfficeAddress}`;

  return (
    <main>
      <section className="contact-hero">
        <div className="contact-hero-photo" aria-hidden="true">
          <Image
            src="/media/heroes/contact.webp"
            alt=""
            fill
            priority
            sizes="100vw"
          />
        </div>
        <Eyebrow>Contact Aureum</Eyebrow>
        <h1>
          Every enduring development begins with a{" "}
          <em>meaningful conversation.</em>
        </h1>
        <p>
          Whether you are evaluating an industrial opportunity, considering
          expansion or exploring a strategic development partnership, we welcome
          the conversation. Every significant development starts with an idea
          worth exploring.
        </p>
      </section>
      <section className="contact-form">
        <div>
          <Eyebrow>Strategic conversation</Eyebrow>
          <h2>Tell us what you&apos;re exploring.</h2>
          <p className="contact-form-intro">
            Every conversation begins with understanding the opportunity. Share
            what matters now; the right development pathway follows.
          </p>
        </div>
        <ContactForm />
      </section>
      <section className="office">
        <div className="office-copy">
          <Eyebrow>Office & Location</Eyebrow>
          <h2>
            Dubai,
            <br />
            United Arab Emirates
          </h2>
          <div className="office-details">
            <p>
              <small>Office</small>
              {contact.addressOne}
              <br />
              {contact.addressTwo}
              <br />
              {contact.addressThree}
              <br />
              {contact.addressFour}
              <br />
              {contact.addressFive}
            </p>
            <p>
              <small>Contact</small>
              <span className="pending-contact-row">
                Email <b><a href={`mailto:${contact.primaryEmail}`}>{contact.primaryEmail}</a></b>
              </span>
              {contact.secondaryEmail && (
                <>
                  <br />
                  <span className="pending-contact-row">
                    Secondary <b><a href={`mailto:${contact.secondaryEmail}`}>{contact.secondaryEmail}</a></b>
                  </span>
                </>
              )}
              <br />
              <span className="pending-contact-row">
                Telephone <b><a href={`tel:${contact.phoneHref}`}>{contact.phoneDisplay}</a></b>
              </span>
            </p>
          </div>
        </div>
        <div className="map" aria-label="Map showing Aureum's Dubai office">
          <iframe
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={mapEmbedUrl}
            title="Aureum office at Capricorn Tower, Dubai"
          />
          <div className="map-location-card">
            <span>Dubai office</span>
            <strong>{contact.addressTwo}</strong>
            <small>{[contact.addressThree, contact.addressFour, contact.addressFive].filter(Boolean).map((line) => line.trim().replace(/,\s*$/, "")).join(", ")}</small>
            <a href={mapSearchUrl} rel="noreferrer" target="_blank">
              Open in Google Maps ↗
            </a>
          </div>
        </div>
      </section>
      <section className="alternative-contact">
        <Eyebrow>For Existing Partners</Eyebrow>
        <p>
          If you are an existing Aureum partner, please contact your dedicated
          relationship manager directly. For urgent matters outside working
          hours, please use the priority contact details provided in your
          partnership documentation.
        </p>
      </section>
      <ContactMotion />
    </main>
  );
}
