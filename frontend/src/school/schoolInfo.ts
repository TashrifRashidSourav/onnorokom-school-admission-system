/**
 * The school this portal belongs to. It is a fictional demo school (see ASSUMPTIONS.md);
 * the contact details are placeholders, not real numbers or mailboxes.
 */
export const school = {
  name: 'Onnorokom School & College',
  nameBn: 'অন্যরকম স্কুল অ্যান্ড কলেজ',
  shortName: 'Onnorokom School',
  motto: 'Knowledge · Discipline · Character',
  mottoBn: 'জ্ঞান · শৃঙ্খলা · চরিত্র',
  established: 1998,
  address: 'Dhaka, Bangladesh',
  phone: '+880 1700-000000',
  email: 'admission@onnorokom-school.example',
  officeHours: 'Sunday to Thursday, 9:00 AM to 4:00 PM',
  /** Academic year the online admission is for. */
  session: '2027',
  sessionBn: '২০২৭',
} as const
