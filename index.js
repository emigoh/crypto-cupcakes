require('dotenv').config('.env');
const cors = require('cors');
const express = require('express');
const app = express();
const morgan = require('morgan');
const { PORT = 3000 } = process.env;
// TODO - require express-openid-connect and destructure auth from it
const { auth } = require('express-openid-connect');
const { User, Cupcake } = require('./db');

// middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

/* *********** YOUR CODE HERE *********** */
// follow the module instructions: destructure config environment variables from process.env
// follow the docs:
  // define the config object
  // attach Auth0 OIDC auth router
  // create a GET / route handler that sends back Logged in or Logged out

  const {
    AUTH0_SECRET,
    AUTH0_AUDIENCE = 'http://localhost:3000',
    AUTH0_CLIENT_ID,
    AUTH0_BASE_URL,
  } = process.env;
  
  const config = {
    authRequired: true, // this is different from the documentation
    auth0Logout: true,
    secret: AUTH0_SECRET,
    baseURL: AUTH0_AUDIENCE,
    clientID: AUTH0_CLIENT_ID,
    issuerBaseURL: AUTH0_BASE_URL,
  };
  app.use(async (req, res, next) => {
    try{
      const [user] = await User.findOrCreate({
        where: {
          username: `${req.oidc.user.nickname}`,
          name: `${req.oidc.user.first_name}`,
          email: `${req.oidc.user.email}`
        }
      });
      console.log(user);
      // console.log(req.oidc.user)
      
      // call next() before the end of the route, to allow subsequent routers/routes to be matched
      next();
    }catch(error){
      console.log(error);
    }
  });


  app.get('/', (req, res) => {
    // console.log(req.oidc.user);
    res.send(req.oidc.isAuthenticated() 
    ? 
    `<h1>Crypto Cupcakes</h1> 
    <h2> Welcome, ${req.oidc.user.name}<h2>
    <h3> Username: ${req.oidc.user.nickname}</h3>
    <img src=${req.oidc.user.picture}>
    <br> <br>
    <button onclick="window.location.href='http://localhost:3000/cupcakes';">Cupcakes</button>
    <br> <br>
      <button onclick="window.location.href='http://localhost:3000/logout';">Log Out</button>
    `
    : 
    'Logged out');
  });

  app.get("/me", async(req,res,next)=> {
    try{
      // Find user with User.findOne
      const user = await User.findOne({
        where: {
          username: req.oidc.user.nickname
        },
        raw: true,
      });
  
      // If/else statement - Assign token with user. No user, no token
      if(user){
        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1w' });
  
        // Send back the object {user, token}
        res.send({user, token})
  
      }else{
        res.status(401).send("No user");
      }
    }catch(error){
      console.error(error);
      next(error);
    }
  })

app.get('/cupcakes', async (req, res, next) => {
  try {
    const cupcakes = await Cupcake.findAll();
    res.send(cupcakes);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// error handling middleware
app.use((error, req, res, next) => {
  console.error('SERVER ERROR: ', error);
  if(res.statusCode < 400) res.status(500);
  res.send({error: error.message, name: error.name, message: error.message});
});

app.listen(PORT, () => {
  console.log(`Cupcakes are ready at http://localhost:${PORT}`);
});

