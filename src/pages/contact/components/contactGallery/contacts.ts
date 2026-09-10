/**
 * Contact directory for MohanaMantra 2K26.
 *
 * Organised as *sections* rather than one card per person, because a section can
 * own more than one point of contact - the Website team has three. Both renderers
 * read from here: the `/contact` page (ContactGallery) and the landing-page doors
 * (ContactDoors), so this is the single place to edit when the committee hands
 * over new numbers.
 */

export interface ContactPerson {
    /** Name as supplied by the organising committee. */
    name: string;
    /** Designation, rendered on its own line under the name. */
    title?: string;
    /**
     * Display form of the number, spacing included. The `tel:` href is derived
     * from this by stripping everything that is not a digit or a leading `+`, so
     * the display string is free to be formatted for readability. Omitted when
     * the committee has not supplied a number yet.
     */
    phone?: string;
}

export interface ContactSection {
    /** Section label, rendered as the small heading above the names. */
    section: string;
    /** One or more people to reach for this section, in the order shown. */
    people: ContactPerson[];
}

/**
 * Shared fest inbox. The tags do not surface a mail link, but the address is kept
 * here so it is not lost if a contact form or footer needs it later.
 */
export const FEST_EMAIL = "mohanamantra@mbu.asia";

const registrations: ContactSection = {
    section: "Registrations",
    people: [{ name: "Murali" }],
};

const sponsorship: ContactSection = {
    section: "Sponsorship",
    people: [
        {
            name: "Dr. N. Anil Kumar",
            title: "Assistant Professor, Dept. of ECE",
            phone: "+91 95425 33355",
        },
    ],
};

const marketing: ContactSection = {
    section: "Marketing",
    people: [
        {
            name: "Lt. Nurulla",
            title: "Associate NCC Officer - NCC",
            phone: "+91 89190 68421",
        },
    ],
};

const website: ContactSection = {
    section: "Website",
    people: [
        { name: "Sameer", phone: "+91 89851 37419" },
        { name: "Monish", phone: "+91 63021 68359" },
        { name: "Krishna Chaitanya", phone: "+91 93987 67703" },
    ],
};

const queries: ContactSection = {
    section: "Queries",
    people: [
        {
            name: "Mouli",
            title: "Student Coordinator",
            phone: "+91 63039 24890",
        },
    ],
};

/**
 * How the tags are arranged, on both the `/contact` page and the landing-page
 * doors. Each inner array is a row: one tag centred on the first, the three
 * delivery-side sections across the second, one centred on the last.
 *
 * Re-ordering the page means moving entries between these arrays - no layout
 * change needed. Rows collapse to fewer columns on smaller screens, at which
 * point the tags read top to bottom in exactly this order.
 */
export const contactRows: ContactSection[][] = [
    [registrations],
    [sponsorship, marketing, website],
    [queries],
];

/** Flat list in row order, for consumers that lay the tags out themselves. */
const contacts: ContactSection[] = contactRows.flat();

export default contacts;
