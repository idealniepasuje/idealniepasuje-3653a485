// Editable message templates sent from employer to candidate.

export type MessageType = 'linkedin_request' | 'profile_completion' | 'interview_invite';
export type InterviewType = 'online' | 'phone' | 'onsite';

export const getLinkedinRequestTemplate = (lang: string, companyName?: string): string => {
  const company = companyName?.trim() || (lang === 'en' ? 'our company' : 'naszej firmy');
  if (lang === 'en') {
    return `Hi! We're interested in your profile at ${company}. Could you share a link to your LinkedIn profile? It will help us learn more about your professional background. Thank you!`;
  }
  return `Cześć! W ${company} jesteśmy zainteresowani Twoim profilem. Czy mógłbyś/mogłabyś podzielić się linkiem do swojego profilu LinkedIn? Pomoże nam to lepiej poznać Twoje doświadczenie zawodowe. Dziękujemy!`;
};

export const getProfileCompletionTemplate = (lang: string, companyName?: string): string => {
  const company = companyName?.trim() || (lang === 'en' ? 'our company' : 'naszej firmy');
  if (lang === 'en') {
    return `Hi! Your profile looks promising for an opening at ${company}. To move forward, could you please complete the missing sections: your work description, experience details and the "Get to know me" section? Once your profile is complete we can unlock the full view. Thanks!`;
  }
  return `Cześć! Twój profil wygląda obiecująco dla rekrutacji w ${company}. Aby przejść dalej, czy możesz uzupełnić brakujące sekcje: opis pracy, doświadczenie oraz sekcję „Daj się poznać"? Gdy profil będzie kompletny, odblokujemy pełny widok. Dziękujemy!`;
};

export const getInterviewInviteTemplate = (
  lang: string,
  type: InterviewType,
  companyName?: string,
  calendarLink?: string,
): string => {
  const company = companyName?.trim() || (lang === 'en' ? 'our team' : 'naszego zespołu');
  const typeLabelPl = type === 'online' ? 'rozmowę online' : type === 'phone' ? 'rozmowę telefoniczną' : 'spotkanie stacjonarne';
  const typeLabelEn = type === 'online' ? 'an online meeting' : type === 'phone' ? 'a phone call' : 'an on-site meeting';
  const calendarPl = calendarLink ? `\n\nWybierz dogodny termin w kalendarzu: ${calendarLink}` : '';
  const calendarEn = calendarLink ? `\n\nPlease pick a slot in the calendar: ${calendarLink}` : '';
  if (lang === 'en') {
    return `Hi! We're impressed with your profile and we'd love to invite you to the next stage of recruitment for ${company}. We'd like to schedule ${typeLabelEn} to get to know each other better.${calendarEn}\n\nLooking forward to meeting you!`;
  }
  return `Cześć! Jesteśmy pod wrażeniem Twojego profilu i chcielibyśmy zaprosić Cię do kolejnego etapu rekrutacji do ${company}. Proponujemy ${typeLabelPl}, abyśmy mogli się lepiej poznać.${calendarPl}\n\nDo zobaczenia!`;
};
