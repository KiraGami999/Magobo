import { describe, expect, it } from 'vitest';
import { listNotificationsSchema, NOTIFICATION_EVENTS, resolveNotificationHref } from '@magobo/shared';

describe('listNotificationsSchema', () => {
  it('accepts pagination and unreadOnly', () => {
    const result = listNotificationsSchema.safeParse({ page: '1', unreadOnly: 'true' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unreadOnly).toBe(true);
    }
  });
});

describe('NOTIFICATION_EVENTS', () => {
  it('includes core marketplace events', () => {
    expect(NOTIFICATION_EVENTS).toContain('PROPOSAL_ACCEPTED');
    expect(NOTIFICATION_EVENTS).toContain('MESSAGE_RECEIVED');
    expect(NOTIFICATION_EVENTS).toContain('PROJECT_COMPLETED');
  });
});

describe('resolveNotificationHref', () => {
  it('links messages to the conversation', () => {
    expect(
      resolveNotificationHref('MESSAGE_RECEIVED', {
        conversationId: 'conv-1',
        gigId: 'gig-1',
      }),
    ).toBe('/messages/conv-1');
  });

  it('links project events to the project workspace', () => {
    expect(resolveNotificationHref('DELIVERABLE_SUBMITTED', { gigId: 'gig-1' })).toBe('/projects/gig-1');
  });

  it('links proposals to the proposal detail page', () => {
    expect(
      resolveNotificationHref('PROPOSAL_ACCEPTED', { gigId: 'gig-1', proposalId: 'prop-1' }),
    ).toBe('/proposals/prop-1');
  });
});
