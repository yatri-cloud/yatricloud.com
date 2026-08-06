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
  const showPublishedState = Boolean(event?.isUpcoming);
  const showHelpNeeded = !showPublishedState;

  return {
    showHelpNeeded,
    showPublishedState,
    hasCommunityContent,
    hasApprovedContent: approvedVenue || approvedSpeaker || approvedSponsor,
  };
}
