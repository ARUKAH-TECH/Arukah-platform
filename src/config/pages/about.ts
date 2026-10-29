import type { PageDef } from "./types";

// The About page: the meaning of the name and the founder's story, in the
// founder's own words (Oct 2026). Editable from Admin → Page text.

export const aboutPage: PageDef = {
  id: "about",
  label: "About ZIVARUKAH",
  path: "/about",
  groups: [
    {
      title: "The name",
      fields: [
        { key: "nameTitle", label: "Heading", kind: "text", max: 100, default: "What does ZIVARUKAH mean?" },
        { key: "nameIntro", label: "Introduction", kind: "textarea", max: 300, default: "ZIVARUKAH joins two Hebrew words: ZIVA and ARUKAH." },
        {
          key: "zivaText",
          label: "ZIVA",
          kind: "textarea",
          max: 400,
          default: "From the Hebrew ziv: radiance, brightness, light. To us, ZIVA is the light of God: the light that shows the way and drives out darkness.",
        },
        {
          key: "arukahText",
          label: "ARUKAH",
          kind: "textarea",
          max: 500,
          default:
            "אֲרוּכָה: healing and restoration. In the Bible it pictures new flesh growing over a wound until it is whole again. It is the word in Jeremiah 30:17: “I will restore health unto thee, and I will heal thee of thy wounds.” To us, ARUKAH is total restoration.",
        },
        {
          key: "togetherText",
          label: "Together",
          kind: "textarea",
          max: 600,
          default:
            "Together: the light of God that brings total restoration. ZIVARUKAH connects the spiritual and the physical, the Word of God for the soul, and skills, technology, education and good work for everyday life, so that people are restored and whole.",
        },
        { key: "motto", label: "Short motto", kind: "text", max: 80, default: "God's light brings total restoration." },
      ],
    },
    {
      title: "The founder",
      fields: [
        { key: "founderTitle", label: "Heading", kind: "text", max: 100, default: "Meet the founder" },
        {
          key: "founderStory",
          label: "Story (one paragraph per line)",
          kind: "list",
          max: 700,
          maxItems: 8,
          default: [
            "Shepherd Justice Sarpong Oduro (legal name: Sarpong Oduro Justice) is the founder and leader of ZIVARUKAH and Repent Online Ministries. Every branch, ARUKAH TECH, ARUKAH WEAR, ZIVA Special Classes, the ZIVA Literacy app, ARUKAH MEDIA, ZIVARUKAH BOOKS and the ministry, is founded and led by him.",
            "He loved the Bible and Bible teaching from infancy. In primary school he taught his friends so often that they nicknamed him “Roman Father”. At 13 he began preaching as a young evangelist, and when he completed JHS the nickname became “Pastor”.",
            "He carried the name Pastor until he completed his national service as a teacher. Then he chose a name he loves more: Shepherd. A shepherd feeds and cares for the flock instead of feeding on it. His conviction is that a minister should not be a burden to the church, but, like Christ, the Good Shepherd, should feed God's people and lead them into eternity, instead of draining them.",
            "That conviction is why he builds businesses alongside the ministry: so that the work of God is supported, not burdened. He chose the name ZIVARUKAH because its meaning, the light of God and total restoration, describes who he wants to be and what he wants every branch to do.",
            "A trained teacher, he loves to teach and train others in whatever he learns. Some of the people he has trained now work in evangelism and in shoemaking.",
            "He is the author of The Wicked and Unforgiving Student, and has five more books written and coming soon. He is based in the Ashanti Region of Ghana.",
          ],
        },
      ],
    },
  ],
};
