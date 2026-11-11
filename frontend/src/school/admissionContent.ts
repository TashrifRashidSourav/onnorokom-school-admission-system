// Text content of the admission portal: notices, rules and frequently asked questions.
// Notices are sample content for the fictional demo school (see ASSUMPTIONS.md).

export interface Notice {
  date: string
  title: string
  titleBn?: string
  text: string
  important?: boolean
}

export const notices: Notice[] = [
  {
    date: '2026-11-10',
    title: 'Online admission for session 2027 is open',
    titleBn: '২০২৭ শিক্ষাবর্ষে অনলাইন ভর্তি চলছে',
    text: 'Apply online for any class and shift with free seats. Seats are given first come, first served; there is no lottery.',
    important: true,
  },
  {
    date: '2026-11-10',
    title: 'Pay the admission fee before the hold expires',
    titleBn: 'মেয়াদের মধ্যে ভর্তি ফি দিন',
    text: 'Applying holds a seat for a limited time. If the fee is not paid in time, the seat is released for other applicants.',
  },
  {
    date: '2026-11-08',
    title: 'Morning and day shifts have separate seats',
    text: 'Each shift is its own class with its own seats, so apply for the shift the student will attend.',
  },
  {
    date: '2026-11-05',
    title: 'Keep the birth registration number ready',
    text: "The student's 17-digit birth registration number identifies the application. No account or password is needed.",
  },
]

export interface Rule {
  title: string
  titleBn: string
  text: string
}

export const admissionRules: Rule[] = [
  {
    title: 'First come, first served',
    titleBn: 'আগে আবেদন, আগে আসন',
    text: 'Seats go in the order applications arrive. There is no lottery and no waiting list.',
  },
  {
    title: 'One application per class',
    titleBn: 'এক ক্লাসে একটি আবেদন',
    text: 'A student can have one active application or admission in each class and shift at a time.',
  },
  {
    title: 'Pay within the time limit',
    titleBn: 'নির্ধারিত সময়ে ফি',
    text: 'After applying, the seat is held for the student for a limited time. Paying the admission fee in that time confirms the admission.',
  },
  {
    title: 'Unpaid seats are released',
    titleBn: 'ফি না দিলে আসন ছেড়ে দেওয়া হয়',
    text: 'When the time runs out, the seat goes back to the pool for other applicants, automatically.',
  },
  {
    title: 'Each shift is a separate class',
    titleBn: 'প্রতিটি শিফট আলাদা',
    text: 'Morning and day shifts of the same class have their own seats and their own applications.',
  },
  {
    title: 'Paid admissions are final online',
    titleBn: 'ফি দেওয়ার পর বাতিল অনলাইনে নয়',
    text: 'An unpaid application can be cancelled at any time. After paying, contact the admission office for any change.',
  },
]

export interface Faq {
  question: string
  answer: string
}

export const faqs: Faq[] = [
  {
    question: 'Do I need an account to apply?',
    answer:
      "No. Enter the student's 17-digit birth registration number at the top of the page. It identifies the student and their applications, so no account or password is needed.",
  },
  {
    question: 'How long is a seat held after applying?',
    answer:
      'For a limited time. The application page shows a countdown with the exact time left and the deadline. Pay the admission fee before it reaches zero.',
  },
  {
    question: 'What happens if I do not pay in time?',
    answer:
      'The application expires and the seat is released to other applicants. If the class still has free seats, you can apply again.',
  },
  {
    question: 'Can I apply for more than one class or shift?',
    answer:
      'Yes, one application per class and shift. For example, a student may apply to both Class 6 Morning Shift and Class 6 Day Shift.',
  },
  {
    question: 'Is the online payment real?',
    answer:
      'This portal simulates the payment: pressing "Pay admission fee" counts as a successful payment and confirms the admission at once.',
  },
  {
    question: 'I closed the browser. Is my application lost?',
    answer:
      'No. Applications are saved by the school. Enter the same birth registration number and open My applications to see them all.',
  },
  {
    question: 'Can I cancel an application?',
    answer:
      'Yes, while the fee is unpaid. The seat is released at once. A paid admission cannot be cancelled online; contact the admission office.',
  },
  {
    question: 'Why does the number of free seats change by itself?',
    answer:
      'Other parents apply, pay and cancel at the same time. The page updates the seat counts every few seconds so you always see the current numbers.',
  },
]
