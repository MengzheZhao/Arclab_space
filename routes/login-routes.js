const { v4: uuid } = require("uuid");
const express = require("express");
const router = express.Router();
const crypto = require("crypto");

// The DAO that handles CRUD operations for users.
const userDao = require("../modules/users-dao.js");
const articlesDao = require("../modules/articles-dao.js");

// Whenever we navigate to ANY page, make the user object associated with the auth cookie (if any)
// available to the Handlebars engine by adding it to res.locals.

router.use(async function (req, res, next) {

    const user = await userDao.retrieveUserWithAuthToken(req.cookies.authToken);
    res.locals.user = user;
    next();
});


// Whenever we navigate to /login, if we're already logged in, redirect to "/".
// Otherwise, render the "login" view, supplying the given "message" query parameter
// to the view engine, if any.
router.get("/login", function (req, res) {

    if (res.locals.user) {
        res.redirect("/myArticles");
    }

    else {
        res.locals.message = req.query.message;
        res.render("login");
    }

});

// Whenever we POST to /login, check the username and password submitted by the user.
// If they match a user in the database, give that user an authToken, save the authToken
// in a cookie, and redirect to "/". Otherwise, redirect to "/login", with a "login failed" message.
router.post("/api/login", async function (req, res) {

    // Get the username and password submitted in the form
    const username = req.body.username;
    const password = req.body.password;
    let Encrypt = (data) => {
        const cipher = crypto.createCipher('aes192', '9805');
        var crypted = cipher.update(data, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    }
    
    let encrypted = Encrypt(password)

    // Find a matching user in the database
    const user = await userDao.retrieveUserWithCredentials(username, encrypted);

    // if there is a matching user...
     
    if (user) {
        //Auth success - give that user an authToken, save the token in a cookie, and redirect to the homepage.
        const authToken = uuid();
        user.authToken = authToken;
        await userDao.updateUser(user);
        res.setHeader("authToken",authToken);
        res.cookie("authToken", authToken);
        res.status(204).send();
    }

    // Otherwise, if there's no matching user...
    else {
        // Auth fail
        res.status(401).send();
    }
    
});

// Whenever we navigate to /logout, delete the authToken cookie.
// redirect to "/login", supplying a "logged out successfully" message.
router.get("/api/logout", function (req, res) {
    res.clearCookie("authToken");
    res.status(204).send();
});

// Account creation
router.get("/newAccount", function(req, res) {
    res.locals.message = req.query.message;
    res.render("new-account");
})

router.post("/newAccount", async function(req, res) {
    const user = {
        username: req.body.username,
        password: req.body.password,
        name: req.body.realname,
        birthday: req.body.birthday,
        description: req.body.description,
    };

    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword

    if(password != confirmPassword){
        res.redirect("/newAccount?message= Passwords do not match!");
    }
    else{
        let Encrypt = (data) => {
            const cipher = crypto.createCipher('aes192', '9805');
            var crypted = cipher.update(data, 'utf8', 'hex');
            crypted += cipher.final('hex');
            return crypted;
        }
        
        let encrypted = Encrypt(password)
        
        user.password = encrypted;

        const avatar = 'avatar' + Math.round(Math.random()*35) + '.jpg';
        user.avatar = avatar;
        try {
            await userDao.createUser(user);
            res.redirect("/login?message=Account creation successful. <br>Please login using your new credentials.");
        }
        catch (err) {
            res.redirect("/newAccount?message=Sorry, Account creation failed!");
        }
    }
});

// Check the username before new account form submit
router.get('/checkUsername', async function(req, res) {
    const username = req.query.username;

    const user = await userDao.retrieveUserByUsername(username);

    if (user) {
        res.status(404).send();
    } else {
        res.status(200).send();
    }
});

router.get("/changePassword", async function(req,res){
    res.locals.message = req.query.message;
    res.render("changePassword");
});

router.post('/deleteAccount',async function(req,res){
    const userID = req.body.id;
    const role = req.body.role;
    if(role == "admin"){
        res.redirect("/personalDetails?message=Admin can not be deleted!")
    } else{
    try {
        await articlesDao.deleteArticleByPublisherID(userID);
        await articlesDao.deleteCommentRecordByUserID(userID);
        await userDao.deleteUser(userID);
        res.clearCookie("authToken");
        res.redirect("/login?message=Account has been Deleted!");
    }
    catch (err) {
        res.redirect("/personalDetails?message=Sorry, please try again!");
    }
}
});

router.post('/changePassword', async function(req, res) {
    const user = {
        id:req.body.id,
        password:req.body.password
    };

    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword

    if(password != confirmPassword){
        res.redirect("/changePassword?message= Passwords do not match!");
    }
    
    else{
        let Encrypt = (data) => {
            const cipher = crypto.createCipher('aes192', '9805');
            var crypted = cipher.update(data, 'utf8', 'hex');
            crypted += cipher.final('hex');
            return crypted;
        }
        
        let encrypted = Encrypt(password)
        
        user.password = encrypted;

        try {
            await userDao.changePassword(user);
            res.redirect("/personalDetails?message=Change the Password Successful!");
        }
        catch (err) {
            res.redirect("/changePassword?message=Sorry, please try again!");
        }
    }
});

module.exports = router;
