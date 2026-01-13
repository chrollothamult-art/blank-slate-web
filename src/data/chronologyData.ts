export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  dateValue: number; // For sorting
  era: 'BGD' | 'GD' | 'AGD';
  description: string;
  fullArticle: string;
}

export const timelineEvents: TimelineEvent[] = [
  {
    id: "age-of-beasts",
    title: "Age of Beasts",
    date: "2700 – 1800 BGD",
    dateValue: -2700,
    era: "BGD" as const,
    description: "An era when beasts ruled the lands, before the coming of civilization.",
    fullArticle: "The Age of Beasts marks the primordial epoch of our world, a time when mighty creatures roamed freely across untamed wilderness. This era, spanning nearly a millennium, saw the dominance of ancient beasts whose power shaped the very landscape of our realm. The Age of Beasts came to an end with the arrival of Veldrum Cyrad, heralding a new chapter in the world's history."
  },
  {
    id: "arrival-veldrum",
    title: "Arrival of Veldrum Cyrad",
    date: "1800 BGD",
    dateValue: -1800,
    era: "BGD" as const,
    description: "The coming of Veldrum Cyrad, marking the end of the Age of Beasts.",
    fullArticle: "The arrival of Veldrum Cyrad in 1800 BGD marked a pivotal turning point in history. This mysterious entity brought with it knowledge and power that would forever change the balance of the world. The beasts that once ruled began to retreat, and a new order began to emerge from the chaos of the primordial age."
  },
  {
    id: "birth-petronai-children",
    title: "Birth of Petronai's Children",
    date: "1500 BGD",
    dateValue: -1500,
    era: "BGD" as const,
    description: "The creation of Petronai's divine offspring who would shape the world.",
    fullArticle: "In 1500 BGD, Petronai brought forth children of immense power and wisdom. These beings were created to guide and protect the world, each embodying different aspects of creation. Their influence would be felt throughout the ages, and their legacy continues to impact the world even in their absence."
  },
  {
    id: "first-chimera",
    title: "Creation of the First Chimera",
    date: "1200 BGD",
    dateValue: -1200,
    era: "BGD" as const,
    description: "The first fusion of multiple beings, creating a new form of life.",
    fullArticle: "The creation of the First Chimera in 1200 BGD represented a dark turning point in magical experimentation. Through forbidden rituals, multiple creatures were merged into a single, powerful entity. This act would set a dangerous precedent and lead to countless attempts to replicate the process, with varying degrees of success and horror."
  },
  {
    id: "disappearance-petronai",
    title: "Disappearance of Petronai",
    date: "800 BGD",
    dateValue: -800,
    era: "BGD" as const,
    description: "The mysterious vanishing of Petronai, leaving the world without divine guidance.",
    fullArticle: "In 800 BGD, Petronai mysteriously disappeared without warning or explanation. The sudden absence of this divine presence sent shockwaves throughout the realm. Left without their creator's guidance, Petronai's children struggled to maintain order, and the world began its slow descent into chaos and uncertainty."
  },
  {
    id: "veldrum-civil-war",
    title: "Veldrum Civil War",
    date: "650 BGD",
    dateValue: -650,
    era: "BGD" as const,
    description: "A devastating conflict that tore apart the Veldrum civilization.",
    fullArticle: "The Veldrum Civil War of 650 BGD was a catastrophic conflict that divided the once-unified Veldrum civilization. Brother fought against brother, and the land was scarred by magical warfare of unprecedented scale. The war lasted for decades and resulted in the loss of countless lives and invaluable knowledge."
  },
  {
    id: "death-of-wonder",
    title: "Death of Wonder",
    date: "600 BGD",
    dateValue: -600,
    era: "BGD" as const,
    description: "The fall of Wonder, one of Petronai's most beloved children.",
    fullArticle: "Wonder, known for bringing joy and inspiration to mortals, fell in 600 BGD. The circumstances of Wonder's death remain shrouded in mystery, but its impact was immediate and profound. The world seemed to dim, and creativity and hope became scarce commodities in the years that followed."
  },
  {
    id: "fall-of-question",
    title: "Fall of Question",
    date: "24 BGD",
    dateValue: -24,
    era: "BGD" as const,
    description: "The demise of Question, bringing an end to an era of inquiry and knowledge.",
    fullArticle: "Question, the embodiment of curiosity and learning, fell in 24 BGD. With Question's fall, the pursuit of knowledge became dangerous and rare. Libraries were burned, scholars persecuted, and the world entered an age of ignorance that would persist until the Great Darkening."
  },
  {
    id: "fall-rise-phalagneon",
    title: "Fall of Zephyrelle / Rise of Phalagneon",
    date: "24 BGD",
    dateValue: -24,
    era: "BGD" as const,
    description: "The fall of one power and the rise of another, reshaping the political landscape.",
    fullArticle: "In the same year that Question fell, the kingdom of Zephyrelle collapsed, and from its ashes rose the empire of Phalagneon. This dramatic shift in power marked the end of an age and the beginning of a new, darker era. Phalagneon would dominate the world stage until the Great Darkening."
  },
  {
    id: "thou-art-chosen",
    title: "Events of Thou Art Chosen",
    date: "2700 BGD – 23 BGD",
    dateValue: -2700,
    era: "BGD" as const,
    description: "The epic saga of the Chosen Ones who shaped destiny across millennia.",
    fullArticle: "Spanning nearly three thousand years, the events chronicled in 'Thou Art Chosen' tell the tale of individuals marked by fate to perform great deeds. These chosen heroes and villains shaped the course of history through their actions, sacrifices, and failures. Their legacy would influence all that came after."
  },
  {
    id: "great-darkening",
    title: "The Great Darkening",
    date: "0 GD",
    dateValue: 0,
    era: "GD" as const,
    description: "The cataclysmic event that plunged the world into an age of shadow and despair.",
    fullArticle: "The Great Darkening marks year zero of the current calendar. On this day, an unexplained phenomenon blotted out the sun for three days and three nights. When light returned, the world had fundamentally changed. Magic behaved differently, ancient structures had appeared or vanished, and the first of the Marked Ones were born. This event serves as the dividing line between the old world and the new."
  },
  {
    id: "birth-marked-ones",
    title: "Birth of the first of the Marked Ones",
    date: "0 GD",
    dateValue: 0,
    era: "GD" as const,
    description: "The emergence of individuals bearing mysterious marks of power during the Great Darkening.",
    fullArticle: "During the three days of the Great Darkening, children were born across the world bearing strange marks upon their skin. These Marked Ones possessed abilities that defied explanation and seemed connected to the cataclysm itself. They would become both feared and revered, playing crucial roles in the world's survival and transformation."
  },
  {
    id: "thou-art-darkens",
    title: "Events of Thou Art Darkens",
    date: "24 BGD – 30 AGD",
    dateValue: -24,
    era: "AGD" as const,
    description: "Chronicles of survival and struggle in the shadow of the Great Darkening.",
    fullArticle: "The events of 'Thou Art Darkens' chronicle the tumultuous period surrounding the Great Darkening. This saga tells of heroes who fought to preserve what remained of civilization, villains who sought to exploit the chaos, and ordinary people struggling to survive in a world turned upside down."
  },
  {
    id: "thou-art-remains",
    title: "Events of Thou Art Remains",
    date: "0 – 20 AGD",
    dateValue: 0,
    era: "AGD" as const,
    description: "The aftermath of the Great Darkening and the struggle to rebuild.",
    fullArticle: "In the two decades following the Great Darkening, the world slowly began to rebuild. 'Thou Art Remains' tells the stories of those who refused to give in to despair, who built new communities on the ruins of the old, and who dared to hope for a better future despite all evidence to the contrary."
  },
  {
    id: "konans-venture",
    title: "Konan's Venture",
    date: "17 AGD",
    dateValue: 17,
    era: "AGD" as const,
    description: "A legendary expedition that would change the understanding of the world forever.",
    fullArticle: "In 17 AGD, the explorer known as Konan embarked on a perilous journey into uncharted territories beyond the known world. What Konan discovered on this venture would challenge everything believed about the nature of reality. Though many details remain classified, the expedition's findings influenced magical theory and geographic understanding for generations."
  },
  {
    id: "testament-witness",
    title: "Testament of the Witness Record",
    date: "23 AGD",
    dateValue: 23,
    era: "AGD" as const,
    description: "The completion of the Witness's great work, documenting all of history.",
    fullArticle: "The Testament of the Witness Record, completed in 23 AGD, represents the culmination of a lifetime's work by an unknown scholar known only as 'the Witness.' This comprehensive chronicle attempts to document all of history, from the Age of Beasts to the present day. It remains the most authoritative historical text, though many question how one person could have known so much."
  },
  {
    id: "death-witness",
    title: "Death of the Witness",
    date: "30 AGD",
    dateValue: 30,
    era: "AGD" as const,
    description: "The passing of the mysterious chronicler of ages.",
    fullArticle: "Seven years after completing the Testament, the Witness died under mysterious circumstances in 30 AGD. The identity of this legendary figure was never confirmed, and many theories persist about who they truly were. Some claim the Witness was one of Petronai's children in disguise, while others believe they were the last of an ancient order of historians."
  },
  {
    id: "tale-jimiah",
    title: "Tale of Jimiah",
    date: "30 – 48 AGD",
    dateValue: 30,
    era: "AGD" as const,
    description: "The adventures of Jimiah, whose actions would lead to the Break of Infinity.",
    fullArticle: "The Tale of Jimiah chronicles the life and adventures of a mysterious figure whose quest for power and knowledge would have catastrophic consequences. Over eighteen years, Jimiah traveled the world, gathering artifacts and forbidden knowledge. This journey would culminate in the event known as the Break of Infinity."
  },
  {
    id: "break-infinity",
    title: "Break of Infinity",
    date: "48 AGD",
    dateValue: 48,
    era: "AGD" as const,
    description: "A magical catastrophe that shattered the barriers between realms.",
    fullArticle: "The Break of Infinity in 48 AGD was a cataclysmic event caused by Jimiah's attempt to transcend mortal limitations. The ritual went catastrophically wrong, shattering the barriers between different planes of existence. Reality itself became unstable, and beings from other realms began to appear in our world. The effects of this event are still felt today."
  },
  {
    id: "birth-child-reverence",
    title: "Birth of the Child of Reverence",
    date: "50 AGD",
    dateValue: 50,
    era: "AGD" as const,
    description: "The arrival of a being prophesied to heal the world's wounds.",
    fullArticle: "Two years after the Break of Infinity, the Child of Reverence was born. This individual, whose birth was foretold in ancient prophecies, is believed to possess the power to mend the damage done to reality. Whether they will fulfill this destiny remains to be seen, but their presence has given many hope for the first time in decades."
  },
  {
    id: "return-petronai",
    title: "Return of Petronai",
    date: "53 AGD",
    dateValue: 53,
    era: "AGD" as const,
    description: "After over 800 years, Petronai returns to a changed world.",
    fullArticle: "In 53 AGD, Petronai returned after an absence of more than 850 years. The world that greeted them was vastly different from the one they had left. The reasons for Petronai's disappearance and return remain unknown, but their presence has brought both hope and fear. Some see salvation in their return, while others question what being could abandon their creation for so long."
  }
].sort((a, b) => a.dateValue - b.dateValue);

export const almanacCategories = [
  { id: "kingdoms", title: "Kingdoms", icon: "Castle" },
  { id: "characters", title: "Characters", icon: "User" },
  { id: "relics", title: "Relics", icon: "Sparkles" },
  { id: "races", title: "Races", icon: "Users" },
  { id: "titles", title: "Titles", icon: "Crown" },
  { id: "locations", title: "Locations", icon: "MapPin" },
  { id: "magic", title: "Magic", icon: "Wand2" },
  { id: "concepts", title: "Concepts", icon: "BookOpen" }
];
