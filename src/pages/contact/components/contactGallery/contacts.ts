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
    people: [
        {
            name: "P Jubella Khan",
            phone: "+91 86394 59052",
        },
    ],
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

const discipline: ContactSection = {
    section: "Discipline",
    people: [
        {
            name: "K. Murali Krishna",
            title: "Student Head, Discipline Committee",
            phone: "+91 63028 84402",
        },
    ],
};

const websiteDeveloper: ContactSection = {
    section: "Website",
    people: [
        {
            name: "V Sameer Reddy",
            title: "Lead Web Developer",
            phone: "+91 89851 37419",
        },
    ],
};

const websiteCloud: ContactSection = {
    section: "Website",
    people: [
        {
            name: "G Monish Reddy",
            title: "Cloud & DevOps Lead",
            phone: "+91 63021 68359",
        },
    ],
};

const websiteDesign: ContactSection = {
    section: "Website",
    people: [
        {
            name: "K Krishna Chaitanya",
            title: "UI/UX Design Lead",
            phone: "+91 93987 67703",
        },
    ],
};

/**
 * How the tags are arranged on both the `/contact` page and the landing-page doors:
 * - Row 1: Registrations, Sponsorship, Marketing
 * - Row 2: Queries, Discipline
 * - Row 3: Website team (Lead Developer, Cloud & DevOps, UI/UX Design)
 */
export const contactRows: ContactSection[][] = [
    [registrations, sponsorship, marketing],
    [queries, discipline],
    [websiteDeveloper, websiteCloud, websiteDesign],
];

/** Flat list in row order, for consumers that lay the tags out themselves. */
const contacts: ContactSection[] = contactRows.flat();

export default contacts;
