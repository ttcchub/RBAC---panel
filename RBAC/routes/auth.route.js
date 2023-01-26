const router = require('express').Router();
const User = require('../models/user.model');
const {body, validationResult} = require('express-validator'); 
const passport = require('passport');
const { ensureLoggedOut, ensureLoggedIn } = require('connect-ensure-login');


 
router.get('/login', ensureLoggedOut({ redirectTo: '/' }), async (req,res,next)=>{
    res.render('login')
}) 

// So after authentification its gonna redirect depends from succes or fail of login 

router.post(
  '/login',
  ensureLoggedOut({ redirectTo: '/' }),
  passport.authenticate('local', {
    // successRedirect: '/',
    successReturnToOrRedirect: '/',
    failureRedirect: '/auth/login',
    failureFlash: true,
  })
);
 
router.get('/register', ensureLoggedOut({ redirectTo: '/' })
    ,async (req,res,next)=>{
    res.render('register');
})

router.post('/register', ensureLoggedOut({ redirectTo: '/' }),
    [
    // validating input to use it in errors after that 
    body('email')
        .trim()
        .isEmail()
        .withMessage('Email must be a valid email')
        .normalizeEmail()
        .toLowerCase(),

    body('password')
        .trim()
        .isLength(2)
        .withMessage("Password length short , minimum 2  charachters"),
     
    body('password2').custom((value, {req}) => {
        if (value !== req.body.password){
            throw new Error('Password not matching');
             }
            return true;
        }), 
   
   
    ], async (req,res,next)=>{
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            errors.array().forEach(error => {
                req.flash('error', error.msg)
            })
            res.render('register', { 
                email: req.body.email,
                messages: req.flash(),
            });
            return
        }

        const {email} = req.body;
        const doesExist = await User.findOne({email});

        //check if its already exists 
        if (doesExist){
            res.redirect('/auth/register');
            return;
        }

        const user = new User(req.body)
        await user.save();
        // after succesfull register it will redirect to login page
        req.flash(
            'success', 
            `${user.email} Succesfull registration. You can login`
            );
        res.redirect('/auth/login')

    } catch (error) {
        next(error);
    }
});
  

router.get('/logout', ensureAuthenticated, async(req, res, next) => {

    //new updated after release bug handler
    // https://stackoverflow.com/questions/72336177/error-reqlogout-requires-a-callback-function

    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/auth/login');
      });
    });

    // try {
    //     if (this){
    //     req.logout();
    //     res.redirect('/auth/login');
    //     return;
    //     }  next()
    // }catch (error){
    //     next(error)
    // }

module.exports = router


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/auth/login');
  }
}

function ensureNOTAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect('back');
  } else {
    next();
  }
}

