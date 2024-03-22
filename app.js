// Setup Express
const express = require("express");
const app = express();
const port = 3000;

// Setup Handlebars
const handlebars = require("express-handlebars");
app.engine("handlebars", handlebars({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");

// Setup fs
const fs = require("fs");

// Setup body-parser
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Setup cookie-parser
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Make the "public" folder available statically
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));


// Setup our middleware 
const { addUserToLocals } = require("./modules/verify-auth");
app.use(addUserToLocals);

// Setup our routes
const loginRouter = require("./routes/login-routes.js");
app.use(loginRouter);

const appRouter = require("./routes/application-routes.js");
app.use(appRouter);

const userRouter = require("./routes/user.routes.js");
app.use(userRouter);

// Start the server running. Once the server is running, the given function will be called, which will
// log a simple message to the server console. Any console.log() statements in your node.js code
// can be seen in the terminal window used to run the server.
app.listen(port, function () {
    console.log(`App listening on port ${port}!`);
});