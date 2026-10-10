import { cdn } from "../../../../utils/cdn";
import { useEffect, useState } from "react";

const categoryAliases: Record<string, string[]> = {
  kalakshetra: ["kalakshetra", "dance", "drama", "drama & theatre", "drama and theatre"],
  technoholic: ["technoholic", "tech"],
  "band night": ["band night", "music"],
  "spot events": ["spot events", "spot", "misc"],
  "dj night": ["dj night", "pro shows", "proshow", "photography"],
};

const dummyEventsData = [
  {
    category_name: "Kalakshetra",
    events: [
      { name: "Fusion Dance", club_name: "Dance Club", venue: "Main Stage", description: "Combine dance styles and showcase your energy on stage.", image_url: cdn("/images/events/Eventpics/Fusion_dance.webp") },
      { name: "Folk Dance", club_name: "Dance Club", venue: "Main Stage", description: "Celebrate cultural roots through vibrant folk dance.", image_url: cdn("/images/events/Eventpics/Folk_dance.webp") },
      { name: "Traditional Dressing Competition", club_name: "Cultural Club", venue: "Main Stage", description: "Flaunt authentic traditional attire and grace.", image_url: cdn("/images/events/Eventpics/Traditional_Dressing_competition.webp") },
      { name: "Talent show", club_name: "Cultural Club", venue: "Open Air Theatre", description: "Showcase your unique skills and extraordinary talents.", image_url: cdn("/images/events/Eventpics/Talent_show.webp") },
      { name: "Fashion Show", club_name: "Fashion Club", venue: "Main Stage", description: "Walk the ramp in style.", image_url: cdn("/images/events/Eventpics/Fashion_show.webp"), object_position: "center top" },
      { name: "Spot Photography", club_name: "Photography Club", venue: "Campus Wide", description: "Capture spontaneous aesthetics across campus.", image_url: cdn("/images/events/Eventpics/Spot_photography.webp") }
    ]
  },
  {
     category_name: "Band Night",
    events: [
      { name: "Band Battle", club_name: "Music Club", venue: "Main Auditorium", description: "Battle of the musical bands.", image_url: cdn("/images/events/Eventpics/Band_Battle.webp"), scale: 0.88 },
      { name: "Dedicate a song", club_name: "Music Club", venue: "Campus Radio", description: "Dedicate your favorite song to someone special.", image_url: cdn("/images/events/Eventpics/Dedicate_a_song.webp") },
      { name: "Solo and Group Singing", club_name: "Music Club", venue: "Main Auditorium", description: "Melodious vocal performances in solo & group categories.", image_url: cdn("/images/events/Eventpics/Solo_and_group_singing.webp") }
    ]
  },
  {
    category_name: "Technoholic",
    events: [
      { name: "Water Rocket Launch", club_name: "Aerospace Club", venue: "Open Ground", description: "Design, build, and launch water-powered rockets into the sky.", image_url: cdn("/images/events/Eventpics/Water-Rocket-Launch.webp") },
      { name: "Tech Exhibition", club_name: "Tech Club", venue: "Seminar Hall", description: "Showcase cutting-edge student projects and tech innovations.", image_url: cdn("/images/events/Eventpics/Tech-Exhibition.webp") },
      { name: "Hackathon", club_name: "Coding Club", venue: "Main Lab", description: "Intense coding and innovation marathon.", image_url: cdn("/images/events/Eventpics/Hackathon.webp") },
      { name: "Robo Race", club_name: "Robotics Club", venue: "Open Track", description: "High-speed autonomous and manual bot racing.", image_url: cdn("/images/events/Eventpics/Robo-Race.webp") },
      { name: "Agri Plex", club_name: "Agri-Tech Club", venue: "Exhibition Pavilion", description: "Exploring agricultural technology and smart farming solutions.", image_url: cdn("/images/events/Eventpics/Agri-Plex.webp") },
      { name: "CADathon", club_name: "Design Club", venue: "CAD Lab", description: "Speed 3D modeling and computer-aided design challenge.", image_url: cdn("/images/events/Eventpics/CADathon.webp") },
      { name: "Life Saver Workshop", club_name: "Health & First-Aid Club", venue: "Main Auditorium", description: "Hands-on emergency medical response and CPR training.", image_url: cdn("/images/events/Eventpics/Life_saver_workshop.webp") }
    ]
  },
  {
    category_name: "Spot Events",
    events: [
      { name: "Push-up Challenge", club_name: "Fitness Club", venue: "Open Ground", description: "Test your ultimate upper body strength.", image_url: cdn("/images/events/Eventpics/Push_up_challenge.webp") },
      { name: "Shoot and Edit", club_name: "Media Club", venue: "Campus Wide", description: "Capture reels & videos and edit them on the spot.", image_url: cdn("/images/events/Eventpics/Shoota_and_edit.webp") },
      { name: "Jenga", club_name: "Fun Club", venue: "Food Court", description: "Don't let the tower fall.", image_url: cdn("/images/events/Eventpics/Jenga.webp") },
      { name: "Tug of War", club_name: "Sports Club", venue: "Ground", description: "Show your team strength.", image_url: cdn("/images/events/Eventpics/Tug_of_war.webp") },
      { name: "Food Challenge", club_name: "Food & Fun Club", venue: "Food Court", description: "Eat fast, win big! Ultimate eating challenge.", image_url: cdn("/images/events/Eventpics/Food_challenge.webp") },
      { name: "Gully Cricket", club_name: "Sports Club", venue: "Open Ground", description: "Classic street-style cricket tournament.", image_url: cdn("/images/events/Eventpics/Gully_cricket.webp") },
      { name: "Treasure Hunt", club_name: "Adventure Club", venue: "Campus Wide", description: "Find the hidden treasures across campus.", image_url: cdn("/images/events/Eventpics/Treasure_hunt.webp") }
    ]
  },
  {
    category_name: "DJ Night",
    events: [
      { name: "DJ OnEDGE", club_name: "Cultural Club", venue: "Main Stage", description: "High-energy EDM and DJ tracks to light up the night.", image_url: "/images/events/dj/onedge.jpg", isDj: true, instagram: "https://www.instagram.com/onedgeofficial/?hl=en", logo: "/images/events/dj/onedge-logo.png" },
      { name: "Lera NOVA", club_name: "Cultural Club", venue: "Main Stage", description: "Electrifying performance to keep the crowd moving.", image_url: "/images/events/dj/leranova.jpg", isDj: true, instagram: "https://www.instagram.com/lera_audio/?hl=en", logo: "/images/events/dj/leranova-logo.png", object_position: "top center" },
      { name: "Stunt show", club_name: "Sports & Adventure Club", venue: "Outdoor Arena", description: "Thrilling professional bike and stunt performances.", image_url: cdn("/images/events/Eventpics/Stunt_show.webp") },
      { name: "Talk Show", club_name: "Media & Cultural Club", venue: "Main Auditorium", description: "Interactive talk show and Q&A session with popular guests.", image_url: cdn("/images/events/Eventpics/Talk_shows.webp") }
    ]
  }
];

export const useFetchEvents = (category: string) => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = () => {
      try {
        const normalizedCategory = category.trim().toLowerCase();
        const validCategories = (categoryAliases[normalizedCategory] || [normalizedCategory]).map(
          (c) => c.toLowerCase()
        );

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
