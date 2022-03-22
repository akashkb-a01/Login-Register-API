var mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config/config').get(process.env.NODE_ENV);
const salt = 10;

const nodeUserSchema=mongoose.Schema({
    email:{
        type: String,
        required: true
    },
    password:{
        type:String,
        required: true,
        minlength: 8
    },
    name:{
        type: String,
        required: true,
        maxlength: 100
    },
    phone:{
        type: String,
        required: true,
    },
    address:{
        
        line1: {type: String, required: true},
        line2: {type: String, allowBlank: true},
        city: {type: String, required: true},
        state: {type: String, required: true},
        pin: {type: Number, length: 6, required: true}
    },
    token:{
        type: String
    }
});

nodeUserSchema.pre('save', function(next){
    var user = this;

    if(user.isModified('password')){
        bcrypt.genSalt(salt, function(error, salt){
            if (error) return next(error);

            bcrypt.hash(user.password, salt, function(error, hash){
                if(error) return next(error);
                user.password = hash;
                next();
            })
        })
    }
    else next();
});

nodeUserSchema.methods.comparepassword = function(password, cb){
    bcrypt.compare(password, this.password, function(err, isMatch){
        if(err) return cb(next);
        cb(null, isMatch);
    });
}

nodeUserSchema.methods.generateToken = function(cb){
    var user =this;
    var token=jwt.sign(user._id.toHexString(), config.SECRET);

    user.token=token;
    user.save(function(error, user){
        if(error) return cb(error);
        cb(null, user);
    })
}

nodeUserSchema.statics.findByToken=function(token, cb){
    var user=this;

    jwt.verify(token, config.SECRET,function(error, decode){
        user.findOne({"_id": decode, "token":token}, function(error,user){
            if(error) return cb(error);
            cb(null,user);
        })
    })
};

nodeUserSchema.methods.deleteToken=function(token, cb){
    var user=this;

    user.update({$unset : {token :1}}, function(error, user){
        if(error) return cb(error);
        cb(null,user);
    })
}

module.exports = mongoose.model('User', nodeUserSchema);