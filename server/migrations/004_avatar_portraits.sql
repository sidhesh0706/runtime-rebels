UPDATE employees
   SET avatar = replace(avatar, '/api/avatars/', '/api/avatars-v2/')
 WHERE avatar LIKE '/api/avatars/%';

UPDATE users
   SET avatar = replace(avatar, '/api/avatars/', '/api/avatars-v2/')
 WHERE avatar LIKE '/api/avatars/%';
