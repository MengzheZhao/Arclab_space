const express = require("express");
const router = express.Router();
const articlesDao = require("../modules/articles-dao.js");
const usersDao = require("../modules/users-dao.js");
const { generateTreeCommentJsons } = require("../modules/verify-auth");
const upload = require("../modules/multer-uploader.js");
const fs = require("fs");
const writeLineStream = require('lei-stream').writeLine;

// home page
router.get("/", async function (req, res) {
    res.redirect("/login");
});

// go to article details
router.get("/article", generateTreeCommentJsons, async function (req, res) {
    const articleID = req.query.articleID;
    const publisherID = req.query.publisherID;
    const user = await usersDao.retrieveUserWithAuthToken(req.cookies.authToken);
    const article = await articlesDao.retrieveArticleByArticleID(articleID);

    res.locals.article = article;
    htmlFileName = article.contents;
    let content = fs.readFileSync(`./public/article-contents/${htmlFileName}.html`, 'utf8');
    res.locals.content = content;

    if (user) {
        res.locals.userID = user.id;
        const pbID = parseInt(publisherID);
        if (user.id === pbID) {
            res.locals.isPublishedBy = true;
        }
    }
    res.render("article_contents");
});

// personal article list
router.get("/myArticles", async function (req, res) {
    const user = await usersDao.retrieveUserWithAuthToken(req.cookies.authToken);
    res.locals.articles = await articlesDao.retrieveArticlesByUserID(user.id);
    res.render("my_articles");
});

//aboutus page
router.get("/aboutus", async function (req, res) {
    res.locals.layout = false;
    res.render("home");
});

// personal details
router.get("/personalDetails", async function (req, res) {
    res.locals.message = req.query.message;
    res.render("personal_details");
});

// change account info
router.post('/changeAccount', async function (req, res) {
    const role = req.body.role;
    if (role == "admin") {
        res.redirect("/personalDetails");
    } else {
        const user = {
            id: req.body.id,
            username: req.body.username,
            avatar: req.body.avatar,
            name: req.body.realname,
            birthday: req.body.birthday,
            description: req.body.description,
            authToken: req.cookies.authToken
        };
        try {
            await usersDao.updateUser(user);
            res.redirect("/");
        }
        catch (err) {
            res.redirect("/personalDetails?message=Sorry, please try again!");
        }
    }
});

// update user profiles
router.post('/updateUserAvatar', async function (req, res) {
    await usersDao.updateUserAvatar(req.body.id, req.body.avatar);
    res.status(200).send();
});

// update upvote nums and status
router.get("/updateUpvotes", async function (req, res) {
    const userID = req.query.userID;
    const commentID = req.query.commentID;
    const currentUpAndDownVotes = await articlesDao.updateUpvotesByUserIDAndCommentID(userID, commentID);
    res.json(currentUpAndDownVotes);
});

// update downvote nums and status
router.get("/updateDownvotes", async function (req, res) {
    const userID = req.query.userID;
    const commentID = req.query.commentID;
    const currentUpAndDownVotes = await articlesDao.updateDownvotesByUserIDAndCommentID(userID, commentID);
    res.json(currentUpAndDownVotes);
});

// get current vote nums and status
router.get("/getCurrentCommentStatus", async function (req, res) {
    const userID = req.query.userID;
    const commentID = req.query.commentID;
    const currentUpAndDownVotes = await articlesDao.getCurrentCommentStatus(userID, commentID);
    res.json(currentUpAndDownVotes);
})

// create new comment
router.post("/createNewComment", async function (req, res) {
    const hiddenInfo = req.body.hiddenInfo;
    const commentToArticleID = hiddenInfo.split("-")[0];
    const replyToCommentID = hiddenInfo.split("-")[1];
    const publisherID = hiddenInfo.split("-")[2];
    const contents = req.body.contents;
    const currentArticleJSON = await articlesDao.retrieveArticleByArticleID(commentToArticleID);
    const currentArticlePublisherID = await currentArticleJSON.publisherID;
    const newCommentID = await articlesDao.createNewComment(commentToArticleID, replyToCommentID, publisherID, contents);
    res.redirect(`/article?articleID=${commentToArticleID}&publisherID=${currentArticlePublisherID}#comment-card-${commentToArticleID}-${newCommentID}-${publisherID}`);
});

// delete comment
router.get("/deleteComment", generateTreeCommentJsons, async function (req, res) {
    const commentID = req.query.commentID;
    const publisherID = req.query.publisherID;
    const currentArticleID = req.query.articleID;
    await articlesDao.deleteTreeCommentByCommentID(commentID, res.locals.comments);
    res.redirect(`/article?articleID=${currentArticleID}&publisherID=${publisherID}`);
});

// create new article
router.get("/newArticle", async function (req, res) {
    const articleID = req.query.articleID;
    const editID = req.query.editID;
    const article = await articlesDao.retrieveArticleByArticleID(articleID);
    res.locals.article = article;
    res.locals.editID = editID;

    if (article) {
        htmlFileName = article.contents;
        let content = fs.readFileSync(`./public/article-contents/${htmlFileName}.html`, 'utf8')
        res.locals.content = content;
    }
    res.render("new-article");
});

// delete article
router.get("/deleteArticle", async function (req, res) {
    const articleID = req.query.articleID;
    const editID = req.query.editID;

    const deleteArticle = await articlesDao.deleteArticleByArticleID(articleID);
    const deleteComment = await articlesDao.deleteCommentByArticleID(articleID);

    const article = await articlesDao.retrieveArticleByArticleID(articleID);
    fs.unlink(`./public/article-contents/${htmlFileName}.html`, function (err) {
        if (err) {
            console.log(err);
        }
    });

    res.redirect("/myArticles");

})

// create new articles
router.post("/newArticle", async function (req, res) {
    const user = await usersDao.retrieveUserWithAuthToken(req.cookies.authToken);
    const articleID = req.body.articleID;
    const title = req.body.title;
    const content = req.body.content;
    const editID = req.body.editID;
    const myDate = new Date();
    const date = myDate.toLocaleString();
    let htmlFileName = title + myDate.getTime();

    if (editID) {
        article = await articlesDao.retrieveArticleByArticleID(articleID);
        htmlFileName = article.contents;
    }

    let s = writeLineStream(fs.createWriteStream(`./public/article-contents/${htmlFileName}.html`));
    s.write(content);

    if (editID == 1) {
        let article = await articlesDao.editArtile(articleID, title, htmlFileName, date);
        res.redirect(`/article?articleID=${articleID}&publisherID=${user.id}`);
    }
    if (!editID) {
        const articleId = await articlesDao.createNewArticle(title, user.id, htmlFileName, date);
        res.redirect('/myArticles');
    }

});

// upload img
router.post("/uploadImage", upload.single("file"), async function (req, res) {
    const fileInfo = req.file;
    const oldFileName = fileInfo.path;
    const newFileName = `./public/uploadFiles/${fileInfo.originalname}`;
    fs.renameSync(oldFileName, newFileName);
    res.json(fileInfo);

});



// get article JSON ordered by ASC title
router.get("/sortByTitleASCJSON", async function (req, res) {
    const sortArticlesByTitleASC = await articlesDao.sortArticlesByTitleASC();
    res.json(sortArticlesByTitleASC);
});

// get article JSON ordered by DESC title
router.get("/sortByTitleDESCJSON", async function (req, res) {
    const sortArticlesByTitleDESC = await articlesDao.sortArticlesByTitleDESC();
    res.json(sortArticlesByTitleDESC);
});

// get article JSON ordered by ASC date
router.get("/sortByDateASCJSON", async function (req, res) {
    const sortArticlesByDateASC = await articlesDao.sortArticlesByDateASC();
    res.json(sortArticlesByDateASC);
})

// get article JSON ordered by DESC date
router.get("/sortByDateDESCJSON", async function (req, res) {
    const sortArticlesByDateDESC = await articlesDao.sortArticlesByDateDESC();
    res.json(sortArticlesByDateDESC);
})

// get article JSON ordered by ASC username
router.get("/sortByUsernameASCJSON", async function (req, res) {
    const sortArticlesByUsernameASC = await articlesDao.sortArticlesByUsernameASC();
    res.json(sortArticlesByUsernameASC);
})

// get article JSON ordered by DESC username
router.get("/sortByUsernameDESCJSON", async function (req, res) {
    const sortArticlesByUsernameDESC = await articlesDao.sortArticlesByUsernameDESC();
    res.json(sortArticlesByUsernameDESC);
})

module.exports = router;