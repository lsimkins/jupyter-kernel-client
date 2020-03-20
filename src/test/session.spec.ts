import Session, { SessionConfig } from '../lib/session';
import crypto from 'crypto';

// {
//   sessionId?: string;
//   username?: string;
//   key: string;
//   signatureScheme: string;
// };

describe('Session', () => {
  it('should generate a uuid session id when not configured with one', () => {
    const session = Session.create({
      key: 'key',
      signatureScheme: 'hmac-sha256'
    });

    expect(typeof session.sessionId).toBe('string');
    expect(session.sessionId)
      .toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should use the configured session id when passed', () => {
    const sessionId = 'some session id';
    const session = Session.create({
      sessionId,
      key: 'key',
      signatureScheme: 'hmac-sha256'
    });

    expect(session.sessionId).toBe(sessionId);
  });

  it('should sign an message with an hmac signature using the configured algorithm', () => {
    const session = Session.create({
      key: 'key',
      signatureScheme: 'hmac-sha256'
    });

    const msg = {
      identity: `client.${session.sessionId}.execute_request`,
      delimiter: '<IDS|MSG>',
      header: {
        msg_id: 'message_id',
        username: 'someUser',
        msg_type: 'execute_request',
        session: session.sessionId,
        date: (new Date()).toISOString(),
        version: '5.3'
      },
      parent_header: {},
      metadata: {},
      content: { }
    };

    const expectedSignature = crypto.createHmac('sha256', session.key)
      .update(JSON.stringify(msg.header))
      .update(JSON.stringify(msg.parent_header))
      .update(JSON.stringify(msg.metadata))
      .update(JSON.stringify(msg.content))
      .digest('hex');

    expect(session.sign(msg)).toBe(expectedSignature);
  })
});