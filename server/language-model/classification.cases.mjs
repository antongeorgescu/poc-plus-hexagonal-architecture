// The regression table for the keyword router: a question, and the topic it must land on
// (null = "no opinion", which the Angular core turns into GENERAL).
//
// Whenever a question reaches the wrong card, ADD IT HERE FIRST with the topic it should
// have reached, watch `npm run test:router` fail, then tune intents.mjs until it passes —
// and the older rows keep you from fixing one question by breaking another.

export const CASES = [
  // -- next payment
  ["I'd like to know when my next payment is due and its amount", 'NEXT_PAYMENT'],
  ['when is my payment due', 'NEXT_PAYMENT'],
  ['What is my next installment?', 'NEXT_PAYMENT'],
  ['how much do I have to pay this month', 'NEXT_PAYMENT'],
  ['what is the amount due', 'NEXT_PAYMENT'],
  ['due date please', 'NEXT_PAYMENT'],

  // -- program of study
  ['Tell me about my program of study', 'PROGRAM_OF_STUDY'],
  ['what am I studying', 'PROGRAM_OF_STUDY'],
  ['show me the details of my program', 'PROGRAM_OF_STUDY'],
  ['what is my field of study', 'PROGRAM_OF_STUDY'],
  ['how long is my program', 'PROGRAM_OF_STUDY'],
  ['what is the tuition for my program', 'PROGRAM_OF_STUDY'],
  ['what is my program code', 'PROGRAM_OF_STUDY'],
  ['what credential does my degree give me', 'PROGRAM_OF_STUDY'],

  // -- loan balance
  ["What's the balance of my loan and when's the maturity date?", 'LOAN_BALANCE'],
  ['how much do I still owe', 'LOAN_BALANCE'],
  ['what is my payoff amount', 'LOAN_BALANCE'],
  ['what is my interest rate', 'LOAN_BALANCE'],
  ['loan balance', 'LOAN_BALANCE'],
  ['when does my loan mature', 'LOAN_BALANCE'],

  // -- make a payment
  ['I want to make an extra payment', 'EXTRA_PAYMENT'],
  ['I want to make a payment', 'EXTRA_PAYMENT'],
  ['pay down my principal', 'EXTRA_PAYMENT'],
  ['I would like to pay a lump sum', 'EXTRA_PAYMENT'],
  ['I want to make an additional payment to my loan balance', 'EXTRA_PAYMENT'],
  ['can I pay extra this month', 'EXTRA_PAYMENT'],

  // -- update profile
  ['I want to update my profile', 'PROFILE_UPDATE'],
  ['change my email', 'PROFILE_UPDATE'],
  ['I just moved', 'PROFILE_UPDATE'],
  ['update my phone number', 'PROFILE_UPDATE'],
  ['I have a new mailing address', 'PROFILE_UPDATE'],
  ['how do I edit my contact details', 'PROFILE_UPDATE'],

  // -- payment history
  ['Show me my payment history', 'PAYMENT_HISTORY'],
  ['What payments have I made?', 'PAYMENT_HISTORY'],
  ['list my past payments', 'PAYMENT_HISTORY'],
  ['I need a receipt for my last payment', 'PAYMENT_HISTORY'],
  ['payment records please', 'PAYMENT_HISTORY'],
  ['show my previous payments', 'PAYMENT_HISTORY'],
  ['transaction history', 'PAYMENT_HISTORY'],
  ['What have I paid so far?', 'PAYMENT_HISTORY'],
  ['when was my last payment', 'PAYMENT_HISTORY'],
  ['show me the payments I have made', 'PAYMENT_HISTORY'],
  ['payment activity on my account', 'PAYMENT_HISTORY'],

  // -- profile update history
  ['Show me my profile update history', 'PROFILE_HISTORY'],
  ['What have I changed on my profile?', 'PROFILE_HISTORY'],
  ['history of my email changes', 'PROFILE_HISTORY'],
  ['show my previous contact updates', 'PROFILE_HISTORY'],
  ['when did my address change history', 'PROFILE_HISTORY'],
  ['contact details history', 'PROFILE_HISTORY'],
  ['past profile updates', 'PROFILE_HISTORY'],
  ['list the changes I made to my phone number', 'PROFILE_HISTORY'],
  ['audit trail for my profile', 'PROFILE_HISTORY'],

  // -- hardship
  ['I may not be able to make payments — I lost my job', 'HARDSHIP'],
  ['I may miss a few payments — what are my options?', 'HARDSHIP'],
  ["I can't afford my payments", 'HARDSHIP'],
  ['I was laid off last week', 'HARDSHIP'],
  ['I am struggling to keep up', 'HARDSHIP'],
  ['I am unemployed and worried', 'HARDSHIP'],

  // -- life event
  ['I just had my first child — do I qualify for interest rate relief?', 'LIFE_EVENT'],
  ['I am getting married next month', 'LIFE_EVENT'],
  ['I am going back to school', 'LIFE_EVENT'],
  ['If a personal event affects my ability to pay, what help is there?', 'LIFE_EVENT'],
  ['we are expecting a baby', 'LIFE_EVENT'],

  // -- repayment options
  ['Do I qualify for a lower interest rate or loyalty rewards?', 'REPAYMENT_OPTIONS'],
  ['how can I pay off my loan faster', 'REPAYMENT_OPTIONS'],
  ['how can I pay it off sooner', 'REPAYMENT_OPTIONS'],
  ['how much extra should I pay to finish early', 'REPAYMENT_OPTIONS'],
  ['what does repayment assistance require', 'REPAYMENT_OPTIONS'],
  ['what if I pay more each month', 'REPAYMENT_OPTIONS'],
  ['can I reduce my rate', 'REPAYMENT_OPTIONS'],

  // -- no opinion
  ['hello there', null],
  ['what is the weather like', null],
  ['tell me a joke', null],
  ['', null],
];
