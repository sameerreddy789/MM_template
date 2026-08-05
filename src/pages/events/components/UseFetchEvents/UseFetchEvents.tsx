import { useEffect, useState } from "react";

const categoryAliases: Record<string, string[]> = {
  drama: ["drama", "drama & theatre", "drama and theatre"],
  music: ["music"],
  misc: ["misc", "fashion"],
  dance: ["dance"],
  photography: ["photography"],
};

const dummyEventsData = [
  {
    category_name: "Drama",
    events: [
      { name: "Stage Play", club_name: "Theatrix", venue: "Main Auditorium", description: "A dramatic stage play competition.", image_url: "https://via.placeholder.com/400x300?text=Stage+Play" },
      { name: "Street Play", club_name: "Theatrix", venue: "Open Air Theatre", description: "Energetic street performances.", image_url: "https://via.placeholder.com/400x300?text=Street+Play" }
    ]
  },
  {
    category_name: "Music",
    events: [
      { name: "Battle of Bands", club_name: "Music Club", venue: "Main Stage", description: "Rock bands competing for the top prize.", image_url: "https://via.placeholder.com/400x300?text=Battle+of+Bands" },
      { name: "Solo Singing", club_name: "Music Club", venue: "Seminar Hall", description: "Showcase your vocal talent.", image_url: "https://via.placeholder.com/400x300?text=Solo+Singing" }
    ]
  },
  {
    category_name: "Dance",
    events: [
      { name: "Group Dance", club_name: "Dance Club", venue: "Main Stage", description: "Synchronized group performances.", image_url: "https://via.placeholder.com/400x300?text=Group+Dance" },
      { name: "Solo Dance", club_name: "Dance Club", venue: "Main Stage", description: "Showcase your solo moves.", image_url: "https://via.placeholder.com/400x300?text=Solo+Dance" }
    ]
  },
  {
    category_name: "Photography",
    events: [
      { name: "Photo Walk", club_name: "Photography Club", venue: "Campus", description: "Capture the essence of the fest.", image_url: "https://via.placeholder.com/400x300?text=Photo+Walk" },
      { name: "Exhibition", club_name: "Photography Club", venue: "Gallery", description: "Display your best shots.", image_url: "https://via.placeholder.com/400x300?text=Exhibition" }
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
