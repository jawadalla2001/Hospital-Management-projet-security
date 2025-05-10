// Load environment variables at the very beginning
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cookie = require('cookie-parser');
const path = require('path');
const ejs = require('ejs');
const multer = require('multer');
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const expressValidator = require('express-validator');
const sweetalert = require('sweetalert2');
const helmet = require('helmet');
const bodyParser = require('body-parser');



// Controller imports
const login = require('./controllers/login');
const home = require('./controllers/home');
const signup = require('./controllers/signup');
const add_doc = require('./controllers/add_doctor');
const doc_controller = require('./controllers/doc_controller');
const db = require('./models/db_controller');
const reset = require('./controllers/reset_controller');
const set = require('./controllers/set_controller');
const employee = require('./controllers/employee.js');
const logout = require('./controllers/logout');
const verify = require('./controllers/verify');
const store = require('./controllers/store');
const landing = require('./controllers/landing');
const complain = require('./controllers/complain');
const inbox = require('./controllers/inbox');
const appointment = require('./controllers/appointment');
const receipt = require('./controllers/receipt');
const chat = require('./controllers/chat');

// Initialize app
const app = express();


// View engine setup
app.set('view engine', 'ejs');

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Consider tightening in production
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        }
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'same-origin' },
    hsts: {
        maxAge: 15552000, // 180 days
        includeSubDomains: true,
        preload: true
    }
}));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'hospital-management-secure-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
    }
}));

// Static and middleware configuration
app.use(express.static('./public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookie());

// Global security headers for all responses
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Route definitions
app.use('/login', login);
app.use('/home', home);
app.use('/signup', signup);
app.use('/doctors', doc_controller);
app.use('/resetpassword', reset);
app.use('/setpassword', set);
app.use('/employee', employee);
app.use('/logout', logout);
app.use('/verify', verify);
app.use('/store', store);
app.use('/', landing);
app.use('/complain', complain);
app.use('/inbox', inbox);
app.use('/appointment', appointment);
app.use('/receipt', receipt);
app.use('/chat', chat);

// Error handling middleware
app.use(function(req, res, next) {
    res.status(404).render('404', { title: '404 - Page Not Found' });
});

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).render('500', { title: '500 - Server Error' });
});

// Server startup
const PORT = process.env.PORT || 3000;
var server = app.listen(PORT, function() {
    console.log(`Server started on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});