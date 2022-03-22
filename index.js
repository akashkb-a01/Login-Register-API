const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const cookieParser = require('cookie-parser');
const db = require('./config/config').get(process.env.NODE_ENV);
const User = require('./models/user');
const {auth} = require('./authentication/auth');
const PORT = process.env.PORT || 3000;

const app = express();

app.use(bodyparser.urlencoded({extended : false}));
app.use(bodyparser.json());
app.use(cookieParser());

mongoose.Promise = global.Promise;
mongoose.connect(db.DATABASE,{useNewUrlParser: true, useUnifiedTopology: true}, function(error){
    if(error) console.log(error);
    console.log("Database connected");
});

app.get('/',function(request, response){
    response.status(200).send(`Welcome to login and register api \nFor login http://localhost:${PORT}/api/login \nFor new user registration http://localhost:${PORT}/api/register`);
});

app.post('/api/register', function(request, response){

    const newUser = new User(request.body);

    User.findOne({email: newUser.email}, function(error, user){
        if(user) return response.status(400).json({auth: false, message: "Email is already in use."});
    
        newUser.save((error, doc) => {
            if(error) {console.log(error);
                return response.status(400).json({success: false});}
            response.status(200).json({success : true, user : doc});
        });
    });
});

app.post('/api/login', function(request, response){
    let token = request.cookies.auth;
    User.findByToken(token,(error, user) => {
        if(error) return response(error);
        if(user) return response.status(400).json({
            error: true,
            message:`${user.name} is already logged in`
        });
    
        else{
            User.findOne({'email':request.body.email}, function(error, user){
                if(!user) return response.json({isAuth : false, message : 'Email is not registered.'});
        
                user.comparepassword(request.body.password,(error,isMatch)=>{
                    if(!isMatch) return response.json({ isAuth : false,message : "Incorrect password."});
        
                user.generateToken((error, user) => {
                    if(error) return response.status(400).send(error);
                    response.cookie('auth',user.token).send(`Welcome ${user.name}. You have successfully logged in.\nTo view profile details http://localhost:${PORT}/api/profile \nTo logout http://localhost:${PORT}/api/logout`);
                });    
            });
          });
        }
    });
});

app.get('/api/profile', auth, function(request, response){
    response.json({
        email: request.user.email,
        name: request.user.name,
        phone: request.user.phone,
        address: request.user.address
    })
});

app.get('/api/logout',auth,function(request, response){
    request.user.deleteToken(request.token,(error, user) => {
        if(error) return response.status(400).send(error);
        return response.status(200).send(`You have successfully logged out.`);
    });

}); 

app.listen(PORT,() => {
    console.log(`App is live at http://localhost:${PORT}`);
});