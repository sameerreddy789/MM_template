import { useEffect, useState } from "react";

const categoryAliases: Record<string, string[]> = {
  kalakshetra: ["kalakshetra", "kalakshera", "drama & theatre", "drama and theatre", "drama"],
  technoholic: ["technoholic", "tech"],
  "spot events": ["spot events", "photography", "spot"],
  "pro shows": ["pro shows", "por shows", "proshow"],
  music: ["music", "misc", "fashion"],
  misc: ["misc", "music", "fashion"],
};

const dummyEventsData = [
  {
    category_name: "Kalakshetra",
    events: [
      { name: "Fusion Dance", club_name: "Dance Club", venue: "Main Stage", description: "Combine dance styles and showcase your energy on stage.", image_url: "/images/logo.webp" },
      { name: "Push-up Challenge", club_name: "Fitness Club", venue: "Open Ground", description: "Test your ultimate upper body strength.", image_url: "/images/logo.webp" },
      { name: "Shoot and Edit", club_name: "Media Club", venue: "Campus Wide", description: "Capture reels & videos and edit them on the spot.", image_url: "/images/logo.webp" },
      { name: "Spot Photography", club_name: "Photography Club", venue: "Campus Wide", description: "Capture spontaneous aesthetics across campus.", image_url: "/images/logo.webp" },
      { name: "Traditional Dressing Competition", club_name: "Cultural Club", venue: "Main Stage", description: "Flaunt authentic traditional attire and grace.", image_url: "/images/logo.webp" },
      { name: "Folk Dance", club_name: "Dance Club", venue: "Main Stage", description: "Celebrate cultural roots through vibrant folk dance.", image_url: "/images/logo.webp" },
      { name: "Talent show", club_name: "Cultural Club", venue: "Open Air Theatre", description: "Showcase your unique skills and extraordinary talents.", image_url: "/images/logo.webp" }
    ]
  },
  {
    category_name: "Music",
    events: [
      { name: "Band Battle", club_name: "Music Club", venue: "Main Auditorium", description: "Battle of the musical bands.", image_url: "/images/events/Eventpics/Band Battle.png" },
      { name: "Dedicate a song", club_name: "Music Club", venue: "Campus Radio", description: "Dedicate your favorite song to someone special.", image_url: "/images/logo.webp" },
      { name: "Solo and Group Singing", club_name: "Music Club", venue: "Main Auditorium", description: "Melodious vocal performances in solo & group categories.", image_url: "/images/logo.webp" },
      { name: "Fashion Show", club_name: "Fashion Club", venue: "Main Stage", description: "Walk the ramp in style.", image_url: "/images/logo.webp" }
    ]
  },
  {
    category_name: "Technoholic",
    events: [
      { name: "Water Rocket Launch", club_name: "Aerospace Club", venue: "Open Ground", description: "Design, build, and launch water-powered rockets into the sky.", image_url: "/images/events/Eventpics/Water-Rocket-Launch.png" },
      { name: "Tech Exhibition", club_name: "Tech Club", venue: "Seminar Hall", description: "Showcasing cutting-edge student projects and tech innovations.", image_url: "/images/events/Eventpics/Tech-Exhibition.png" },
      { name: "Hackathon", club_name: "Coding Club", venue: "Main Lab", description: "Intense coding and innovation marathon.", image_url: "/images/events/Eventpics/Hackathon.png" },
      { name: "Robo Race", club_name: "Robotics Club", venue: "Open Track", description: "High-speed autonomous and manual bot racing.", image_url: "/images/events/Eventpics/Robo-Race.png" },
      { name: "Agri Plex", club_name: "Agri-Tech Club", venue: "Exhibition Pavilion", description: "Exploring agricultural technology and smart farming solutions.", image_url: "/images/events/Eventpics/Agri-Plex.png" },
      { name: "CADathon", club_name: "Design Club", venue: "CAD Lab", description: "Speed 3D modeling and computer-aided design challenge.", image_url: "/images/events/Eventpics/CADathon.png" },
      { name: "Life Saver Workshop", club_name: "Health & First-Aid Club", venue: "Main Auditorium", description: "Hands-on emergency medical response and CPR training.", image_url: "/images/logo.webp" }
    ]
  },
  {
    category_name: "Spot Events",
    events: [
      { name: "Spot Photography", club_name: "Photography Club", venue: "Campus", description: "Capture the moment.", image_url: "/images/logo.webp" },
      { name: "Jenga", club_name: "Fun Club", venue: "Food Court", description: "Don't let the tower fall.", image_url: "/images/logo.webp" },
      { name: "Tug of War", club_name: "Sports Club", venue: "Ground", description: "Show your team strength.", image_url: "/images/logo.webp" },
      { name: "Food Challenge", club_name: "Food & Fun Club", venue: "Food Court", description: "Eat fast, win big! Ultimate eating challenge.", image_url: "/images/logo.webp" },
      { name: "Gully Cricket", club_name: "Sports Club", venue: "Open Ground", description: "Classic street-style cricket tournament.", image_url: "/images/logo.webp" },
      { name: "Treasure Hunt", club_name: "Adventure Club", venue: "Campus Wide", description: "Find the hidden treasures across campus.", image_url: "/images/logo.webp" }
    ]
  },
  {
    category_name: "Pro Shows",
    events: [
      { name: "The Band Night", club_name: "Cultural Club", venue: "Main Stage", description: "Electrifying live musical band performance.", image_url: "/images/logo.webp" },
      { name: "The DJ Night", club_name: "Cultural Club", venue: "Main Stage", description: "High-energy EDM and DJ tracks to light up the night.", image_url: "/images/logo.webp" },
      { name: "Stunt show", club_name: "Sports & Adventure Club", venue: "Outdoor Arena", description: "Thrilling professional bike and stunt performances.", image_url: "/images/logo.webp" },
      { name: "Talk Show", club_name: "Media & Cultural Club", venue: "Main Auditorium", description: "Interactive talk show and Q&A session with popular guests.", image_url: "/images/logo.webp" }
    ]
  }
];

export const useFetchEvents = (category: string) => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = () => {
      try {
        const normalizedCategory = category.toLowerCase();
        const validCategories = categoryAliases[normalizedCategory] || [normalizedCategory];

        const matchedCats = dummyEventsData.filter((cat: any) =>
          validCategories.includes(cat.category_name.toLowerCase())
        );

        setEvents(matchedCats.flatMap((cat: any) => cat.events));
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };

    fetchEvents();
  }, [category]);

  return events;
};
