const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user.model');

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    // verification function
    async (email, password, done) => {
        // verifying 
        //if there is an any error or incorrect data return flash massage with error 
      try {
        // can loggin only with email
        const user = await User.findOne({ email });
        // Username/email does NOT exist
        if (!user) {
          return done(null, false, {
            message: 'Username/email not registered',
          });
        }
        // Email exist and now we need to verify the password
        const isMatch = await user.isValidPassword(password);
        return isMatch
          ? done(null, user)
          : done(null, false, { message: 'Incorrect email or password' });
        //   in production 
      } catch (error) {
        done(error);
      }
    }
  )
);

//  for setting userID , session automaticly creating cookie  (passport library)
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
 
// searching a contains a cookie , if session exists we call done with user 
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
