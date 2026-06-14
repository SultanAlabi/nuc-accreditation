const FormData = require('form-data');
const axios = require('axios');

const fd = new FormData();
fd.append('file', Buffer.from('hello world'), { filename: 'hello.txt' });
fd.append('category', 'OTHER');

// In Node, form-data exposes getHeaders()
const headers = fd.getHeaders();
console.log('FormData headers (Node):', headers);

// Show how axios would be called (not sending to a server)
axios.post('http://example.local/upload', fd, { headers })
  .then(() => {})
  .catch(() => { console.log('axios prepared headers:', headers); });
