UPDATE employees
   SET avatar = '/api/avatars/' || replace(name, ' ', '-')
 WHERE avatar LIKE 'http%';

UPDATE users
   SET avatar = '/api/avatars/' || replace(name, ' ', '-')
 WHERE avatar LIKE 'http%';
