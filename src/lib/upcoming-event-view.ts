import type { Event } from './events-store';
import type { VenueSubmission, SpeakerSubmission, SponsorSubmission } from './event-submissions-api';
import type { EventRegistration } from './registration-store';

export interface UpcomingEventViewState {
  showHelpNeeded: boolean;
  showPublishedState: boolean;
  hasCommunityContent: boolean;
  hasApprovedContent: boolean;
}

export function getUpcomingEventViewState(
  event: Event | null | undefined,
  submissions: {
    venues: VenueSubmission[];
    speakers: SpeakerSubmission[];
    sponsors: SponsorSubmission[];
  },
  registrations: EventRegistration[]
): UpcomingEventViewState {
  const approvedVenue = submissions.venues.some((submission) => submission.status === 'approved');
  const approvedSpeaker = submissions.speakers.some((submission) => submission.status === 'approved');
  const approvedSponsor = submissions.sponsors.some((submission) => submission.status === 'approved');
  const hasCommunityContent = approvedVenue || approvedSpeaker || approvedSponsor || registrations.length > 0;
  const showPublishedState = true; // Always allow registrations on upcoming event detail
  // Once an event is published (status=upcoming), stop soliciting help — it's already finalized.
  const showHelpNeeded =
    event?.status !== 'upcoming' &&
    Boolean(event?.lookingForVenue || event?.lookingForSpeakers || event?.lookingForSponsors);

  return {
    showHelpNeeded,
    showPublishedState,
    hasCommunityContent,
    hasApprovedContent: approvedVenue || approvedSpeaker || approvedSponsor,
  };
}

