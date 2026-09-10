import type { ContactPerson, ContactSection } from "./contacts";

/**
 * `tel:` hrefs only tolerate digits and a leading `+`, so strip the display
 * spacing back out. The number also stays visible as text because dialling from a
 * desktop browser is a no-op - the link is a convenience on phones, not the only
 * way to read the number.
 */
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

interface ContactCardBodyProps {
    contact: ContactSection;
    /**
     * The two callers live in different CSS modules (Contact.module.scss for the
     * landing doors, ContactGallery.module.scss for the /contact page) that
     * declare the same class names against different surrounding layouts. Passing
     * the resolved module in keeps one copy of the markup while each page keeps
     * its own styling.
     */
    styles: Record<string, string>;
}

/** Name, designation and number. The name is the emphasised line. */
function PersonText({
    person,
    styles,
}: {
    person: ContactPerson;
    styles: Record<string, string>;
}) {
    return (
        <>
            <span className={styles.personName}>{person.name}</span>
            {person.title && (
                <span className={styles.personTitle}>{person.title}</span>
            )}
            {person.phone && (
                <a
                    className={styles.personPhone}
                    href={telHref(person.phone)}
                    aria-label={`Call ${person.name} on ${person.phone}`}
                >
                    {person.phone}
                </a>
            )}
        </>
    );
}

/**
 * Inner content of a hanging contact tag. The tag artwork itself is a background
 * image on the wrapping `.contactItem`, owned by the caller.
 *
 * Two shapes, picked on people count:
 *
 * - **Solo** - a section label over a single name, designation and number.
 * - **Roster** - one row per person, divided from the next by a hairline rule.
 *   Used by Website, whose three members need to stay individually readable and
 *   in a fixed order rather than running together as one block of text.
 */
export default function ContactCardBody({
    contact,
    styles,
}: ContactCardBodyProps) {
    const isRoster = contact.people.length > 1;
    const cardClass = [styles.contactCard, isRoster && styles.contactCardRoster]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={cardClass}>
            <p className={styles.sectionLabel}>{contact.section}</p>

            {isRoster ? (
                // An ordered list, because the committee supplied these three in a
                // deliberate order and it should survive a screen reader too.
                <ol className={styles.roster}>
                    {contact.people.map((person) => (
                        <li className={styles.rosterRow} key={person.name}>
                            <PersonText person={person} styles={styles} />
                        </li>
                    ))}
                </ol>
            ) : (
                <div className={styles.solo}>
                    <PersonText person={contact.people[0]} styles={styles} />
                </div>
            )}
        </div>
    );
}
