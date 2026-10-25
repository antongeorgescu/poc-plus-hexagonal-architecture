// Seed data for the job catalog and the per-borrower chat history.
// db/build.mjs loads these into the job_posting and chat_history tables; edit here and
// run `npm run db:build` to change what the app shows.

/** Job postings, one per row. Pay is an amount + a unit ('yr' | 'hr'); the app formats it. */
export const JOB_POSTINGS = [
  { program: "Computer Science", title: "Junior Software Engineer", company: "Brightloop Systems", city: "Toronto", province: "ON", salaryAmount: 82000, salaryUnit: "yr", type: "Full-time" },
  { program: "Computer Science", title: "IT Support Specialist", company: "Nimbus Cloud", city: "Ottawa", province: "ON", salaryAmount: 28, salaryUnit: "hr", type: "Contract" },
  { program: "Computer Science", title: "QA Analyst", company: "Ledgerline", city: "Vancouver", province: "BC", salaryAmount: 68000, salaryUnit: "yr", type: "Full-time" },
  { program: "Registered Nursing", title: "Registered Nurse — Med/Surg", company: "Seawall Health", city: "Vancouver", province: "BC", salaryAmount: 41, salaryUnit: "hr", type: "Full-time" },
  { program: "Registered Nursing", title: "Home Care Nurse", company: "CareBridge", city: "Victoria", province: "BC", salaryAmount: 38, salaryUnit: "hr", type: "Part-time" },
  { program: "Registered Nursing", title: "Clinic Triage Nurse", company: "Summit Family Clinic", city: "Calgary", province: "AB", salaryAmount: 76000, salaryUnit: "yr", type: "Full-time" },
  { program: "Mechanical Engineering", title: "Mechanical Design Engineer", company: "Peak Manufacturing", city: "Calgary", province: "AB", salaryAmount: 79000, salaryUnit: "yr", type: "Full-time" },
  { program: "Mechanical Engineering", title: "Maintenance Technician", company: "Bow River Foods", city: "Edmonton", province: "AB", salaryAmount: 31, salaryUnit: "hr", type: "Full-time" },
  { program: "Mechanical Engineering", title: "CAD Drafter", company: "Alpine Fabrication", city: "Saskatoon", province: "SK", salaryAmount: 26, salaryUnit: "hr", type: "Contract" },
  { program: "Marketing", title: "Digital Marketing Coordinator", company: "Red River Media", city: "Winnipeg", province: "MB", salaryAmount: 54000, salaryUnit: "yr", type: "Full-time" },
  { program: "Marketing", title: "Social Media Associate", company: "Grove & Co.", city: "Winnipeg", province: "MB", salaryAmount: 22, salaryUnit: "hr", type: "Part-time" },
  { program: "Marketing", title: "Content Marketing Specialist", company: "Northstar SaaS", city: "Toronto", province: "ON", salaryAmount: 61000, salaryUnit: "yr", type: "Full-time" },
  { program: "Graphic Design", title: "Junior Graphic Designer", company: "Plateau Creative", city: "Montreal", province: "QC", salaryAmount: 52000, salaryUnit: "yr", type: "Full-time" },
  { program: "Graphic Design", title: "Production Artist", company: "Griffintown Print", city: "Montreal", province: "QC", salaryAmount: 24, salaryUnit: "hr", type: "Contract" },
  { program: "Graphic Design", title: "UI/UX Design Intern", company: "Mile End Apps", city: "Quebec City", province: "QC", salaryAmount: 21, salaryUnit: "hr", type: "Part-time" },
  { program: "Culinary Arts", title: "Line Cook", company: "Bluenose Bistro", city: "Halifax", province: "NS", salaryAmount: 23, salaryUnit: "hr", type: "Full-time" },
  { program: "Culinary Arts", title: "Pastry Assistant", company: "Spring Garden Bakery", city: "Halifax", province: "NS", salaryAmount: 20, salaryUnit: "hr", type: "Part-time" },
  { program: "Culinary Arts", title: "Kitchen Supervisor", company: "Waterfront Grill Group", city: "St. John's", province: "NL", salaryAmount: 49000, salaryUnit: "yr", type: "Full-time" },
  { program: "General", title: "Customer Service Representative", company: "Maple Ridge Services Group", city: "Mississauga", province: "ON", salaryAmount: 20, salaryUnit: "hr", type: "Full-time" },
  { program: "General", title: "Administrative Assistant", company: "Community Partners", city: "Halifax", province: "NS", salaryAmount: 22, salaryUnit: "hr", type: "Full-time" },
];

/**
 * Raw conversation facts per borrower, shaped by their standing:
 *   type 1 (excellent)       positive tone, long recap
 *   type 2 (delinquency g1)  negative tone, short recap
 *   type 3 (delinquency g2)  more negative tone, very short or none (summary: null)
 */
export const CHAT_HISTORY = {
  alice: {
    liveChatSessions: 6, chatbotMessages: 44, lastContact: "3 days ago", toneScore: 91,
    summary: "Over the past several weeks you have been a highly engaged partner in managing your loan. Across 6 live-chat sessions and 44 chatbot messages you set up autopay, compared refinancing options to secure a lower rate, and checked in as you crossed the halfway mark on your balance. Your questions were forward-looking — extra-payment strategies, loyalty rewards, and payoff timelines — and the tone stayed consistently upbeat and collaborative, often thanking the team for quick, clear answers.",
  },
  grace: {
    liveChatSessions: 6, chatbotMessages: 47, lastContact: "3 days ago", toneScore: 91,
    summary: "Your recent conversations have been steady, organised, and easy to pick up from one contact to the next. Across 6 live-chat sessions and 47 chatbot messages you confirmed your autopay schedule, asked how extra principal payments would shorten your remaining term, and updated your contact details after a move. The tone was calm and appreciative throughout, and nearly every question pointed at staying ahead of the on-time streak you have held for more than five years.",
  },
  bob: {
    liveChatSessions: 2, chatbotMessages: 12, lastContact: "2 weeks ago", toneScore: 36,
    summary: "In your recent chats you raised concerns about a missed payment and asked how to avoid further late fees. Across 2 live-chat sessions and 12 chatbot messages you asked what a short forbearance would cost and whether autopay could be moved closer to your pay date. The conversations were brief and a little tense, but you were clearly looking for a workable path forward.",
  },
  henry: {
    liveChatSessions: 2, chatbotMessages: 11, lastContact: "2 weeks ago", toneScore: 38,
    summary: "Your last few chats centred on a payment that slipped and what it means for your standing. Across 2 live-chat sessions and 11 chatbot messages you asked about grace periods, moving your due date, and whether a smaller monthly amount was possible. The tone was hurried and mildly frustrated, though you stayed constructive and ended by asking what to do next.",
  },
  carol: {
    liveChatSessions: 1, chatbotMessages: 4, lastContact: "6 weeks ago", toneScore: 13,
    summary: "Your last chat was short and frustrated, focused almost entirely on the past-due balance. Across 1 live-chat session and 4 chatbot messages you asked why the amount had grown and whether the account had been referred to collections. The conversation ended without a plan in place, and there has been no contact since.",
  },
  irene: {
    liveChatSessions: 0, chatbotMessages: 2, lastContact: "over 6 weeks ago", toneScore: 11,
    summary: null,
  },
};
