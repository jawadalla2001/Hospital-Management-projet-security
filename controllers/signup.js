const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const db = require.main.require('./models/db_controller');
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const csurf = require('csurf');

// Create CSRF protection middleware
const csrfProtection = csurf({ cookie: true });

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// Render signup form with CSRF token
router.get('/', csrfProtection, function(req, res) {
    res.render('signup.ejs', { csrfToken: req.csrfToken() });
});

// Enhanced validation rules
const signupValidation = [
    check('username')
        .notEmpty().withMessage("Username is required")
        .isLength({ min: 3 }).withMessage("Username must be at least 3 characters long")
        .matches(/^[A-Za-z0-9_]+$/).withMessage("Username can only contain letters, numbers and underscore"),
    check('password')
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
    check('email')
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage('Valid Email required')
        .normalizeEmail()
];

router.post('/', csrfProtection, signupValidation, function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('signup.ejs', { 
            errors: errors.array(),
            csrfToken: req.csrfToken(),
            formData: req.body // Preserve form data for better UX
        });
    }

    const email_status = "not_verified";
    const email = req.body.email;
    const username = req.body.username;
    
    // Check if email or username already exists
    db.findUserByEmail(email, function(err, emailResults) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).render('500', { title: '500 - Server Error' });
        }
        
        if (emailResults && emailResults.length > 0) {
            return res.render('signup.ejs', { 
                errors: [{ msg: 'Email already registered. Please use a different email.' }],
                csrfToken: req.csrfToken(),
                formData: req.body
            });
        }
        
        db.findUserByUsername(username, function(err, usernameResults) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).render('500', { title: '500 - Server Error' });
            }
            
            if (usernameResults && usernameResults.length > 0) {
                return res.render('signup.ejs', { 
                    errors: [{ msg: 'Username already taken. Please choose a different username.' }],
                    csrfToken: req.csrfToken(),
                    formData: req.body
                });
            }
            
            // Hash the password
            bcrypt.hash(req.body.password, 10, function(err, hashedPassword) {
                if (err) {
                    console.error('Encryption error:', err);
                    return res.status(500).render('500', { title: '500 - Server Error' });
                }
                
                // Generate a secure random token (32 bytes converted to hex = 64 characters)
                const token = crypto.randomBytes(32).toString('hex');
                
                // Create the user with hashed password
                db.signup(username, email, hashedPassword, email_status, function(err, signupResult) {
                    if (err) {
                        console.error('Registration error:', err);
                        return res.status(500).render('500', { title: '500 - Server Error' });
                    }
                    
                    // Store verification token
                    db.verify(username, email, token, function(err) {
                        if (err) {
                            console.error('Verification setup error:', err);
                            return res.status(500).render('500', { title: '500 - Server Error' });
                        }
                        
                        // Get user ID for verification
                        db.getuserid(email, function(err, result) {
                            if (err || !result || result.length === 0) {
                                console.error('Error retrieving user ID:', err);
                                return res.status(500).render('500', { title: '500 - Server Error' });
                            }
                            
                            const id = result[0].id;
                            
                            // Build email content with secure verification link
                            const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
                            const verificationLink = `${baseUrl}/verify?id=${id}&token=${token}`;
                            
                            const output = `
                                <p>Dear ${username},</p>
                                <p>Thank you for signing up. Please click the link below to verify your email address:</p>
                                
                                <p><a href="${verificationLink}">Verify Your Email</a></p>
                                
                                <p>If the link doesn't work, you can complete verification by visiting:</p>
                                <p>${baseUrl}/verify</p>
                                <p>And entering your User ID: ${id} and token manually.</p>
                                
                                <p><strong>This is an automatically generated email. Please do not reply.</strong></p>
                                
                                <p>Regards,</p>
                                <p>Hospital Management System</p>
                            `;
                            
                            // Email configuration using environment variables
                            const transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                    user: process.env.EMAIL_USERNAME || 'your-email@gmail.com', // Use environment variable
                                    pass: process.env.EMAIL_PASSWORD || 'your-app-password' // Use environment variable
                                }
                            });
                            
                            const mailOptions = {
                                from: process.env.EMAIL_FROM || 'Hospital Management <your-email@gmail.com>', 
                                to: email, 
                                subject: 'Email Verification - Hospital Management System', 
                                html: output
                            };
                            
                            transporter.sendMail(mailOptions, function(err, info) {
                                if (err) {
                                    console.error('Email sending error:', err);
                                    return res.render('signup_success.ejs', { 
                                        error: 'Registration successful but verification email could not be sent. Please contact support.' 
                                    });
                                }
                                
                                res.render('signup_success.ejs', { 
                                    message: 'Registration successful! Please check your email to verify your account.' 
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});











module.exports =router;