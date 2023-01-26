// user schema
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;
const { roles } = require('../utils/constants');

const UserSchema = new Schema({

  role: {
    type: String,
    enum: [roles.admin, roles.moderator, roles.client],
    default: roles.client
  },
  
  firstName: {
    type: String, 
    required: true, 
    trim: true ,
    unique: true 

  },
  lastName: { 
    type: String, 
    required: true, 
    trim: true ,
    unique: true 

  },
  username: { 
    type: String,
    required: false,
    trim: true,
    unique: true 
  },

  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },
  profilePic: { 
    type: String, 
    default: "../css/icon/profilePic.png"
  },

  likes:[{type: Schema.Types.ObjectId, ref: 'Post'}],
  retweets:[{type: Schema.Types.ObjectId, ref: 'Post'}],
  following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }]


  
},{timestamps: true} );



// fire midlewarew - to save docs in collection
UserSchema.pre('save', async function (next) {
    try {
        // if this user doc is new, than we will hash password
        if(this.isNew){
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(this.password, salt);
            this.password = hashedPassword;
            //registring admin
            if (this.email === process.env.ADMIN_EMAIL.toLocaleLowerCase()){
              this.role = roles.admin;
            }
        }
        next();
    }catch (error){
        next(error)
    }

})

// varification of user with DB 
UserSchema.methods.isValidPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw createHttpError.InternalServerError(error.message);
  }
};




let User2 = mongoose.model('users', UserSchema);
module.exports = User2;