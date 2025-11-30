require('dotenv').config();
const app = require('./app');

const PORT_BE = process.env.PORT_BE;

app.listen(PORT_BE, () => {
  console.log(`Server is running on port ${PORT_BE}`);
});
