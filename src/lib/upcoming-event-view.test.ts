import { describe, it, expect } from 'vitest';
import { getUpcomingEventViewState } from './upcoming-event-view';
import type { Event } from './events-store';

describe('getUpcomingEventViewState', () => {
  const baseEvent: Event = {
    id: 'event-1',
    name: 'Demo Event',
    date: new Date(Date.now() + 86400000).toISOString(),
    timezone: 'IST',
    location: { type: 'offline' },
    category: 'Workshop',
    status: 'upcoming',
    imageUrl: '',
    description: 'Demo',
    isUpcoming: true,
    lookingForVenue: true,
    lookingForSpeakers: false,
    lookingForSponsors: false,
  };

  it('uses the published state for a fresh upcoming event even before community content arrives', () => {
    const state = getUpcomingEventViewState(baseEvent, { venues: [], speakers: [], sponsors: [] }, []);

    expect(state.showHelpNeeded).toBe(false);
    expect(state.showPublishedState).toBe(true);
    expect(state.hasCommunityContent).toBe(false);
  });

  it('switches to the published state once approved submissions or registrations arrive', () => {
    const state = getUpcomingEventViewState(
      baseEvent,
      { venues: [{ id: 'v1', eventId: 'event-1', eventName: 'Demo Event', venueName: 'Venue', address: '123', capacity: 100, facilities: '', contactName: 'Ada', contactEmail: 'ada@example.com', submittedAt: '', status: 'approved' }], speakers: [], sponsors: [] },
      [{ id: 'r1', eventId: 'event-1', eventName: 'Demo Event', registrationCode: 'YC-123', registeredAt: '', status: 'registered', userDetails: { name: 'Ada', email: 'ada@example.com' } } as any]
    );

    expect(state.showHelpNeeded).toBe(false);
    expect(state.showPublishedState).toBe(true);
    expect(state.hasCommunityContent).toBe(true);
  });
});
