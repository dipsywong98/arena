console.log('starting')
require('dotenv').config()
// import './pre-start'; // Must be the first import
import app from '@server'


// Start the server
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`started server at PORT http://localhost:${port}`)
});
