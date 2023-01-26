const express = require('express') 
const createHttpError = require('http-errors')
const morgan = require('morgan');
const mongoose = require('./database');
require('dotenv').config();
const session = require('express-session');
const connectFlash = require("connect-flash");
const passport = require('passport');
const MongoStore = require('connect-mongo');
const { ensureLoggedIn } = require('connect-ensure-login'); // some issue with redirect
const { roles } = require('./utils/constants');



const app = express();
app.use(morgan('dev'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//We storing session inside db to prevent drop down of logIns of users !
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
//     saveUninitialized: false,
     cookie: {
//         // secure: true 
//         // only for https servers , for production application 
      httpOnly: true,
    },

    // in documentational writen already other information, so stay tuned to updates that means 
    // https://github.com/jdesboeufs/connect-mongo#express-or-connect-integration
    // https://stackoverflow.com/questions/39052429/es6-how-to-import-connect-mongo-session

    store: MongoStore.create({ mongoUrl: "mongodb+srv://lyudik:Dfhbfyn890DB@cluster0.cxc7v5m.mongodb.net/?retryWrites=true&w=majority"})
  }));

// // Init Session 
// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//         // secure: true 
//         // only for https servers , for production application 
//       httpOnly: true,
//     },
//     store: MongoStore.create(options)
// })
// );

// For Passport JS Authentication should go after Init session 
app.use(passport.initialize());
app.use(passport.session());
require('./utils/passport.auth');


// to validate user and show exact conent for him
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});
  
// Flash messages
app.use(connectFlash());
//middleware
app.use((req,res,next) => {
    res.locals.messages = req.flash()
    next();
})

app.use("/public", express.static(__dirname + "/public"));

//Routes 
app.use('/', require('./routes/index.route'));
app.use('/auth', require('./routes/auth.route'))
app.use(
  '/user',
  ensureLoggedIn({ redirectTo: '/auth/login' }),
  require('./routes/user.route')
);

app.use(
    '/admin',
    ensureLoggedIn({ redirectTo: '/auth/login' }),
    ensureAdmin,
    require('./routes/admin.route')
  );
app.use((req,res,next) =>{
    next(createHttpError.NotFound())
})
 
/// Error handler
app.use((error, req, res, next) => {
    error.status = error.status || 500; // 500 Internal Server Error
    res.status(error.status);
    res.render('error_40x', { error });
     // return 404 error usually 
  });

const PORT = process.env.PORT || 3010

app.listen(PORT, () => console.log(`                            🚀 Launching . . .  We currently on PORT: ${PORT}`))


// Dont need it since we have npm ensure-loggin >>>>>>

// function ensureAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) {
//     next();
//   } else {
//     res.redirect('/auth/login');
//   }
// } 


function ensureAdmin(req, res, next) {
     if (req.user.role === roles.admin) {
      next();
    } else {
      req.flash('warning', 'you are not Authorized to see this route');
      res.redirect('/');
    }
  }
  
  function ensureModerator(req, res, next) {
    if (req.user.role === roles.moderator) {
      next();
    } else {
      req.flash('warning', 'you are not Authorized to see this route');
      res.redirect('/');
    }
  }


  