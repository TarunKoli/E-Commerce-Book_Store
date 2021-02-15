const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const mongoDbStore = require('connect-mongodb-session')(session);
const MONGODB_URI = 'YOUR_MONGO_URI';
const shopRoute = require('./routes/Shop');
const adminRoute = require('./routes/Admin');
const authRoute = require('./routes/Auth')
const errorController = require('./Controller/404');
const path = require('path');
const User = require('./Models/users');
const flash = require('connect-flash');
const csrf = require('csurf');
const csrfProtection = csrf();

app.set('view engine','ejs');
app.set('views','views');

const store = new mongoDbStore({
    uri : MONGODB_URI,
    collection : 'sessions'
});


const fileStorage = multer.diskStorage({
    destination :(req, file, cb) => {
        cb(null, 'images');
    }, 
    filename : (req, file, cb) => {
        cb(null, file.filename+'-'+file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        cb(null, true);
    }else{
        cb(null, false);
    }
};


app.use(bodyParser.urlencoded({ extended : false }));
app.use(multer({storage : fileStorage, fileFilter : fileFilter}).single('image'));
app.use(express.static(path.join(__dirname,'public')));
app.use('/images',express.static(path.join(__dirname,'images')));


app.use(session({
    secret : 'My Secret', resave : false, saveUninitialized : false, store : store 
}));

app.use(csrfProtection);
app.use(flash());
app.use((req,res,next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn,
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req,res,next)=>{
    if(!req.session.user){
       return next();
    }
    
    User.findById(req.session.user._id)
    .then(user=>{
        
        if(!user){
            return next();
        }
        req.user = user;
        next();
    })
    .catch(err => {
      next(new Error(err));
    });
});



app.use(shopRoute);
app.use(adminRoute);
app.use(authRoute);
app.get('/500', errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next)=>{
    res.status(500).render('500',{doctitle : 'Error'});
});

mongoose.connect(MONGODB_URI)
.then(result => {
    app.listen(4000);
})
.catch(err => {
    console.log(err);
});
