import { useEffect, useState } from "react";

const categoryAliases: Record<string, string[]> = {
  kalakshetra: ["kalakshetra", "kalakshera", "drama & theatre", "drama and theatre", "drama", "dance"],
  technoholic: ["technoholic", "music", "tech"],
  "spot events": ["spot events", "photography", "spot"],
  "pro shows": ["pro shows", "por shows", "proshow"],
  misc: ["misc", "fashion"],
};

const dummyEventsData = [
  {
    category_name: "Kalakshetra",
    events: [
      { name: "Let's Naacho", club_name: "Dance Club", venue: "Main Stage", description: "Show off your dance moves.", image_url: "https://via.placeholder.com/400x300?text=Lets+Naacho" },
      { name: "Band Battle", club_name: "Music Club", venue: "Main Auditorium", description: "Battle of the bands.", image_url: "https://via.placeholder.com/400x300?text=Band+Battle" },
      { name: "PUBG", club_name: "E-Sports Club", venue: "CS Lab", description: "Intense battle royale.", image_url: "https://via.placeholder.com/400x300?text=PUBG" },
      { name: "Push-Up Challenge", club_name: "Fitness Club", venue: "Open Ground", description: "Test your strength.", image_url: "https://via.placeholder.com/400x300?text=Push-Up+Challenge" }
    ]
  },
  {
    category_name: "Technoholic",
    events: [
      { name: "Tech Exhibition", club_name: "Tech Club", venue: "Seminar Hall", description: "Showcasing the latest tech innovations.", image_url: "https://via.placeholder.com/400x300?text=Tech+Exhibition" },
      { name: "Code Sprint", club_name: "Coding Club", venue: "CS Lab", description: "Fast-paced coding competition.", image_url: "https://via.placeholder.com/400x300?text=Code+Sprint" },
      { name: "Hackathon", club_name: "Tech Club", venue: "Main Lab", description: "24-hour hackathon.", image_url: "https://via.placeholder.com/400x300?text=Hackathon" },
      { name: "Workshop on AR/VR", club_name: "Tech Club", venue: "Seminar Hall", description: "Learn about AR and VR.", image_url: "https://via.placeholder.com/400x300?text=Workshop+on+AR/VR" },
      { name: "Robo War", club_name: "Robotics Club", venue: "Open Ground", description: "Battle of the robots.", image_url: "https://via.placeholder.com/400x300?text=Robo+War" }
    ]
  },
  {
    category_name: "Spot Events",
    events: [
      { name: "Spot Photography", club_name: "Photography Club", venue: "Campus", description: "Capture the moment.", image_url: "https://via.placeholder.com/400x300?text=Spot+Photography" },
      { name: "Jenga", club_name: "Fun Club", venue: "Food Court", description: "Don't let the tower fall.", image_url: "https://via.placeholder.com/400x300?text=Jenga" },
      { name: "Tug of War", club_name: "Sports Club", venue: "Ground", description: "Show your team strength.", image_url: "https://via.placeholder.com/400x300?text=Tug+of+War" }
    ]
  },
  {
    category_name: "Pro Shows",
    events: [
      { name: "Band Night", club_name: "Cultural Club", venue: "Main Stage", description: "Live band performances.", image_url: "https://via.placeholder.com/400x300?text=Band+Night" },
      { name: "DJ Nights", club_name: "Cultural Club", venue: "Main Stage", description: "Dance to the beats.", image_url: "https://via.placeholder.com/400x300?text=DJ+Nights" }
    ]
  },
  {
    category_name: "Misc",
    events: [
      { name: "Fashion Show", club_name: "Fashion Club", venue: "Main Stage", description: "Walk the ramp in style.", image_url: "https://via.placeholder.com/400x300?text=Fashion+Show" },
      { name: "Treasure Hunt", club_name: "Adventure Club", venue: "Campus Wide", description: "Find the hidden treasures.", image_url: "https://via.placeholder.com/400x300?text=Treasure+Hunt" }
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
