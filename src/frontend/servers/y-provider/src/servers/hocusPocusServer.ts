import { Server } from '@hocuspocus/server';
import axios from 'axios';

import { logger } from '@/utils';

export const hocusPocusServer = Server.configure({
  name: 'docs-collaboration',
  timeout: 30000,
  quiet: true,
  async onConnect({ requestHeaders, connection, documentName, requestParameters }) {
    const roomParam = requestParameters.get('room');
    let can_edit = false

    try {
      const document = await axios.get(`http://app-dev:8000/api/v1.0/documents/${roomParam}/`, {
        headers: {
          Cookie: requestHeaders['cookie'],
        },
      });

      if (!document.data.abilities.retrieve) {
        return Promise.reject(new Error('Unauthorized'));
      }

      can_edit = document.data.abilities.update;
    } catch (error) {
      return Promise.reject(new Error('Unauthorized'));
    }

    connection.readOnly = !can_edit;
    logger(
      'Connection established:',
      documentName,
      'userId:',
      requestHeaders['x-user-id'],
      'canEdit:',
      can_edit,
      'room:',
      requestParameters.get('room'),
    );

    if (documentName !== roomParam) {
      console.error(
        'Invalid room name - Probable hacking attempt:',
        documentName,
        requestParameters.get('room'),
        requestHeaders['x-user-id'],
      );

      return Promise.reject(new Error('Unauthorized'));
    }

    return Promise.resolve();
  },
});
