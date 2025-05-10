const express = require('express');
const home = require('./home');
const mysql = require('mysql');
const session = require('express-session');
const router = express.Router();
const bodyParser = require('body-parser');
const db = require.main.require('./models/db_controller');
const sweetalert = require('sweetalert2');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

// Anti-brute force protection: limit login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per IP per 15 minutes
    message: "Too many login attempts, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
});

router.get('/', function(req, res) {
    res.render('login.ejs');
});

// Configure secure session
router.use(session({
    secret: process.env.SESSION_SECRET || 'hospital-management-secure-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
    }
}));

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());


router.post('/', [
    check('username').notEmpty().withMessage("Username is required"),
    check('password').notEmpty().withMessage("Password is required")
], loginLimiter, function(request, response) {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(422).json({ errors: errors.array() });
    }

    const username = request.body.username;
    const password = request.body.password;

    if (username && password) {
        // Use a single, consistent error message to prevent username enumeration
        const genericErrorMsg = 'Invalid credentials. Please try again.';
        
        // First, get the user by username only (don't check password in SQL)
        db.findUserByUsername(username, function(error, results) {
            if (error) {
                console.error('Database error:', error);
                return response.status(500).render('500', { title: '500 - Server Error' });
            }
            
            if (results.length === 0) {
                // User not found - but use generic message
                return response.render('login.ejs', { error: genericErrorMsg });
            }
            
            const user = results[0];
            
            // For backward compatibility during transition to bcrypt
            // This allows existing users with plain text passwords to still login
            // while we migrate to hashed passwords
            if (user.password.length < 60) { // Not a bcrypt hash
                if (password === user.password) {
                    // Password matched - upgrade to bcrypt hash for future logins
                    bcrypt.hash(password, 10, function(err, hash) {
                        if (!err) {
                            db.updateUserPassword(user.id, hash, function(updateErr) {
                                if (updateErr) {
                                    console.error('Error upgrading password:', updateErr);
                                }
                            });
                        }
                    });
                    
                    // Continue with login process
                    completeLogin(request, response, user);
                } else {
                    // Invalid password
                    response.render('login.ejs', { error: genericErrorMsg });
                }
            } else {
                // Password is already a bcrypt hash - compare with bcrypt
                bcrypt.compare(password, user.password, function(err, result) {
                    if (err) {
                        console.error('Bcrypt error:', err);
                        return response.status(500).render('500', { title: '500 - Server Error' });
                    }
                    
                    if (result) {
                        // Password matched
                        completeLogin(request, response, user);
                    } else {
                        // Invalid password
                        response.render('login.ejs', { error: genericErrorMsg });
                    }
                });
            }
        });
    } else {
        response.render('login.ejs', { error: 'Please enter username and password' });
    }
});

// Helper function to complete the login process
function completeLogin(request, response, user) {
    // Set secure session variables
    request.session.loggedin = true;
    request.session.userId = user.id;
    request.session.username = user.username;
    
    // Set secure cookie
    response.cookie('username', user.username, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
    });
    
    if (user.email_status === "not_verified") {
        response.render('login.ejs', { error: 'Please verify your email before logging in' });
    } else {
        sweetalert.fire('Logged In!');
        response.redirect('/home');
    }
}

module.exports = router;