import { ContactMotion } from "@/components/contact-experience";
import { ContactForm } from "@/components/contact-form";
import { Eyebrow } from "@/components/ui";
export const metadata = {
  title: "Contact",
  description:
    "Start a conversation with Aureum about industrial development, investment, expansion or strategic partnership opportunities.",
  alternates: { canonical: "/contact" },
};
export default function Page() {
  return (
    <main>
      <section className="contact-hero">
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
              <small>Office</small>Aureum Development
              <br />
              <span className="pending-value">
                Full address pending approval
              </span>
            </p>
            <p>
              <small>Contact</small>
              <span className="pending-contact-row">
                General <b>Email pending approval</b>
              </span>
              <br />
              <span className="pending-contact-row">
                Partnerships <b>Email pending approval</b>
              </span>
              <br />
              <span className="pending-contact-row">
                Media <b>Email pending approval</b>
              </span>
              <br />
              <span className="pending-contact-row">
                Telephone <b>Number pending approval</b>
              </span>
            </p>
            <p>
              <small>Working hours</small>Sunday to Thursday: 9:00 AM – 6:00 PM
              (GST)
              <br />
              Friday and Saturday: Closed
            </p>
          </div>
        </div>
        <div
          className="map"
          aria-label="Map placeholder for Aureum office in Dubai"
        >
          <div className="map-grid" />
          <div className="map-road road-primary" />
          <div className="map-road road-secondary" />
          <div className="map-coordinate">
            <span>Dubai / UAE</span>
            <strong>
              25.2048° N<br />
              55.2708° E
            </strong>
          </div>
          <div className="map-marker">
            <i />
            <span>
              Aureum
              <br />
              Development
            </span>
          </div>
          <div className="map-status">
            <i /> Map integration reserved
          </div>
          <p>Interactive map pending approved location and Mapbox token</p>
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
