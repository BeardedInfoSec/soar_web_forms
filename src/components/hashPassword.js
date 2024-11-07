const bcrypt = require('bcrypt');

const users = [
  { username: 'admin_user', password: 'soaring42', role: 'admin' },
  { username: 'dev_user', password: 'soardev', role: 'developer' },
  { username: 'read_user', password: 'soaruser', role: 'read-only' }
];

const saltRounds = 10;

users.forEach(user => {
  bcrypt.hash(user.password, saltRounds, (err, hash) => {
    if (err) {
      console.error(`Error hashing password for ${user.username}:`, err);
    } else {
      console.log(`INSERT INTO users (username, password, role) VALUES ('${user.username}', '${hash}', '${user.role}');`);
    }
  });
});
