const userDao = require("../modules/users-dao.js");
const articlesDao = require("../modules/articles-dao.js");
/**
 * This function can be added before any route handler function. It will verify that there is a valid
 * authenticated user. If there is, the route handler function will be called. If not, the user will be
 * redirected to /login instead.
 */

// will first to be executed before dao-functions
async function addUserToLocals(req, res, next) {
    const user = await userDao.retrieveUserWithAuthToken(req.cookies.authToken);
    res.locals.user = user;
    next();
}

// transform origin article array to tree structure
async function generateTreeCommentJsons(req, res, next) {

    const originalComments = await articlesDao.retrieveCommentByArticleID(req.query.articleID);
    const treeComments = [];

    // add new properties to array
    for (const commentJson of originalComments) {
        commentJson["subComments"] = [];
        commentJson["ifNested"] = false;
    }

    // make tree structure
    for (let i = 0; i < originalComments.length; i++) {
        for (let j = 0; j < originalComments.length; j++) {
            if (originalComments[j].replyToID === originalComments[i].commentID) {
                originalComments[j].ifNested = true;
                originalComments[i].subComments.push(originalComments[j]);
            }
        }
    }

    // extract json with sub comment
    for (const commentJson of originalComments) {
        if (commentJson.ifNested === false) {
            treeComments.push(commentJson);
        }
    }

    res.locals.comments = treeComments;
    next();
}

module.exports = {
    addUserToLocals,
    generateTreeCommentJsons
}