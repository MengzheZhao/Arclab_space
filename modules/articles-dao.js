const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");


// retrieve publisher
async function retrievePublisherNameByArticleID(id) {
    const db = await dbPromise;
    const name = await db.get(SQL`SELECT u.name FROM users u, articles a
    WHERE u.id  =  a.publisherID AND a.id = ${id};`);
    return name;
}

async function retrievePublisherNameByArticleTitle(title) {
    const db = await dbPromise;
    const name = await db.get(SQL`SELECT u.name FROM users u, articles a
    WHERE u.id  =  a.publisherID AND a.title = ${title};`);
    return name;
}

// retrieve articles
async function retrieveAllArticles() {
    const db = await dbPromise;
    const allArticles = await db.all(SQL`SELECT * FROM articles;`);
    return allArticles;
}

async function retrieveArticleByArticleID(id) {
    const db = await dbPromise;
    const article = await db.get(SQL`SELECT a.*,u.username,u.avatar FROM articles a,users u
                                WHERE a.id = ${id} AND a.publisherID = u.id;`);
    return article;
}

async function retrieveArticlesByUserID(id) {
    const db = await dbPromise;
    const article = await db.all(SQL`SELECT * FROM articles
                                 WHERE publisherID = ${id};`);
    return article;
}

// retrieve comments
async function retrieveCommentByArticleID(articleID) {
    const db = await dbPromise;
    const comment = await db.all(SQL`SELECT c.*,u.username,u.avatar FROM comments c,users u
    WHERE articleID = ${articleID} AND c.publisherID = u.id;`);
    return comment;
}

async function retrieveCommentByPublisherID(publisherID) {
    const db = await dbPromise;
    const comment = await db.all(SQL`SELECT c.*,u.username FROM comments c,users u
    WHERE publisherID = ${publisherID} AND c.publisherID = u.id;`);
    return comment;
}



// every time click upvote button, update the number beside, as well as in the database
async function updateUpvotesByUserIDAndCommentID(userID, commentID) {
    const db = await dbPromise;

    await setFirstTimeUpvoteFlag(db, 0, userID, commentID);// when click, it means user has at least upvoted once

    // before current upvote, if the status is "no upvote"
    if (await getCurrentUpvoteFlag(db, userID, commentID) === 0) {
        await increaseUpvotesByID(db, commentID);// upvote num in database +1
        if (await getFirstTimeDownvoteFlag(db, userID, commentID) === 0) {// if the user has at least upvoted once and want to cancel it
            await decreaseDownvotesByID(db, commentID);//  upvote num in database -1
            await setCurrentDownvoteFlag(db, 0, userID, commentID);// set current downvote status to "no downvote"
        }
        await setCurrentUpvoteFlag(db, 1, userID, commentID);// set current downvote status to "has upvoted"
    }
    // before current upvote, if the status is "has upvoted"
    else if (await getCurrentUpvoteFlag(db, userID, commentID) === 1) {
        await decreaseUpvotesByID(db, commentID);// upvote num in database -1
        await setFirstTimeUpvoteFlag(db, 1, userID, commentID);// recover to "never upvote"
        await setFirstTimeDownvoteFlag(db, 1, userID, commentID);// recover to "never downvote"
        await setCurrentUpvoteFlag(db, 0, userID, commentID);// set current upvote status to "no upvote"
    }
    // if there is no record, it means the user has never upvoted this comment before
    else {
        await increaseUpvotesByID(db, commentID);// upvote num in database +1
        await createRecord(db, userID, commentID);// create a record in db
        await setCurrentUpvoteFlag(db, 1, userID, commentID); // set current upvote status to "has upvoted"
        await setFirstTimeUpvoteFlag(db, 0, userID, commentID); // set "never upvote flag" to false
    }

    return await getCurrentCommentStatus(userID, commentID); // return all the votes' nums and flags
}

// every time click downvote button, update the number beside, as well as in the database
async function updateDownvotesByUserIDAndCommentID(userID, commentID) {

    // the same principle as before
    const db = await dbPromise;
    await setFirstTimeDownvoteFlag(db, 0, userID, commentID);

    if (await getCurrentDownvoteFlag(db, userID, commentID) === 0) {
        await increaseDownvotesByID(db, commentID);
        if (await getFirstTimeUpvoteFlag(db, userID, commentID) === 0) {
            await decreaseUpvotesByID(db, commentID);
            await setCurrentUpvoteFlag(db, 0, userID, commentID);
        }
        await setCurrentDownvoteFlag(db, 1, userID, commentID);
    }
    else if (await getCurrentDownvoteFlag(db, userID, commentID) === 1) {
        await decreaseDownvotesByID(db, commentID);
        await setFirstTimeDownvoteFlag(db, 1, userID, commentID);
        await setFirstTimeUpvoteFlag(db, 1, userID, commentID);
        await setCurrentDownvoteFlag(db, 0, userID, commentID);
    }
    else {
        await increaseDownvotesByID(db, commentID);
        await createRecord(db, userID, commentID);
        await setCurrentDownvoteFlag(db, 1, userID, commentID);
        await setFirstTimeDownvoteFlag(db, 0, userID, commentID);
    }

    return await getCurrentCommentStatus(userID, commentID);
}

// get current upvote/downvote status
async function getCurrentCommentStatus(userID, commentID) {
    const db = await dbPromise;
    // get nums of upvote and downvotes from database
    const upvoteNum = await db.get(SQL`SELECT upvote FROM comments
        WHERE commentID = ${commentID};`);
    const downvoteNum = await db.get(SQL`SELECT downvote FROM comments
        WHERE commentID = ${commentID};`);

    const upvoteFlag = await getCurrentUpvoteFlag(db, userID, commentID);
    const downvoteFlag = await getCurrentDownvoteFlag(db, userID, commentID);

    // return a json
    const currentUpAndDownVotes = {
        upvoteNum: upvoteNum.upvote,
        downvoteNum: downvoteNum.downvote,
        upvoteFlag: upvoteFlag,
        downvoteFlag: downvoteFlag
    }
    return currentUpAndDownVotes;
}

// manipulate vote nums in database 
async function increaseUpvotesByID(db, commentID) {
    await db.run(SQL`UPDATE comments
    SET upvote = upvote + 1
    WHERE commentID = ${commentID};`);
}

async function decreaseUpvotesByID(db, commentID) {
    await db.run(SQL`UPDATE comments
    SET upvote = upvote - 1
    WHERE commentID = ${commentID};`);
}

async function increaseDownvotesByID(db, commentID) {
    await db.run(SQL`UPDATE comments
    SET downvote = downvote + 1
    WHERE commentID = ${commentID};`);
}

async function decreaseDownvotesByID(db, commentID) {
    await db.run(SQL`UPDATE comments
    SET downvote = downvote - 1
    WHERE commentID = ${commentID};`);
}

// get and set upvote status flags
async function getCurrentUpvoteFlag(db, userID, commentID) {
    const flagJson = await db.get(SQL`SELECT haveUpvoted FROM votes WHERE userID = ${userID} AND commentID = ${commentID};`);
    if (flagJson) {
        return flagJson.haveUpvoted;
    } else {
        return null;
    }
}

async function setCurrentUpvoteFlag(db, value, userID, commentID) {
    await db.run(SQL`UPDATE votes
    SET haveUpvoted = ${value}
    WHERE userID = ${userID} AND commentID = ${commentID};`);
}

async function getFirstTimeUpvoteFlag(db, userID, commentID) {
    const flag = await db.get(SQL`SELECT firstTimeUpvote FROM votes
    WHERE userID = ${userID} AND commentID = ${commentID};`);
    return flag.firstTimeUpvote;
}

async function setFirstTimeUpvoteFlag(db, value, userID, commentID) {
    await db.run(SQL`UPDATE votes
    SET firstTimeUpvote = ${value}
    WHERE userID = ${userID} AND commentID = ${commentID};`);
}

// get and set downvote status flags
async function getCurrentDownvoteFlag(db, userID, commentID) {
    const flagJson = await db.get(SQL`SELECT haveDownvoted FROM votes WHERE userID = ${userID} AND commentID = ${commentID};`);
    if (flagJson) {
        return flagJson.haveDownvoted;
    } else {
        return null;
    }
}

async function setCurrentDownvoteFlag(db, value, userID, commentID) {
    await db.run(SQL`UPDATE votes
    SET haveDownvoted = ${value}
    WHERE userID = ${userID} AND commentID = ${commentID};`);
}

async function getFirstTimeDownvoteFlag(db, userID, commentID) {
    const flag = await db.get(SQL`SELECT firstTimeDownvote FROM votes
    WHERE userID = ${userID} AND commentID = ${commentID};`);
    return flag.firstTimeDownvote;
}

async function setFirstTimeDownvoteFlag(db, value, userID, commentID) {
    await db.run(SQL`UPDATE votes
    SET firstTimeDownvote = ${value}
    WHERE userID = ${userID} AND commentID = ${commentID};`);
}

// when a user first time upvote or downvote to a new comment, create a record
async function createRecord(db, userID, commentID) {
    await db.run(SQL`INSERT INTO votes(userID,commentID,haveUpvoted,haveDownvoted)VALUES
    (${userID},${commentID},0,0);`);
}

// create a new comment
async function createNewComment(articleID, replyToID, publisherID, contents) {
    const db = await dbPromise;
    const commentIdJSON = await db.get(SQL`SELECT max(commentID) as maxID FROM comments;`);
    const commentID = await commentIdJSON.maxID + 1;
    await db.run(SQL`insert into comments(articleID,commentID,replyToID,publisherID,contents,commentTime,upvote,downvote)values
    (${articleID},${commentID},${replyToID},${publisherID},${contents},datetime('now'),0,0);`);
    return commentID;
}


// delete tree comment by recursion
async function deleteTreeCommentByCommentID(id, treeComments) {
    for (const comment of treeComments) {
        // if ID matches
        if (comment.commentID === parseInt(id)) {
            // if sub comments not null
            if (comment.subComments.length !== 0) {
                // delete every sub comments by recursion
                for (const subcomment of comment.subComments) {
                    deleteTreeCommentByCommentID(subcomment.commentID, comment.subComments);
                }
                // delete current comment by ID
                deleteCommentByCommentID(id);
            }
            else {
                // if no sub comments, just delete current comment
                deleteCommentByCommentID(id);
            }
        }
        else {
            // if ID doesn't match
            if (comment.subComments.length !== 0) {
                // search in next level recursively
                deleteTreeCommentByCommentID(id, comment.subComments);
            }
        }
    }

}

//  delete comments with votes' record
async function deleteCommentByCommentID(id) {
    const db = await dbPromise;
    await db.run(SQL`DELETE FROM comments
    WHERE commentID = ${id};`);
    await deleteCommentRecordByCommentID(id);
}

async function deleteCommentRecordByCommentID(id) {
    const db = await dbPromise;
    await db.run(SQL`DELETE FROM votes
    WHERE commentID =${id};`);
}
async function deleteCommentRecordByUserID(id) {
    const db = await dbPromise;
    const records = await db.all(SQL`SELECT * FROM votes
    WHERE userID =${id};`);
    for (const record of records) {
        // recover upvote and downvote nums in database
        if (await getCurrentUpvoteFlag(db, id, record.commentID) === 1) {
            await decreaseUpvotesByID(db, record.commentID);
        }
        if (await getCurrentDownvoteFlag(db, id, record.commentID) === 1) {
            await decreaseDownvotesByID(db, record.commentID);
        }
    }
    await db.run(SQL`DELETE FROM votes
    WHERE userID =${id};`);
}

async function deleteCommentByArticleID(id) {
    const db = await dbPromise;
    const allComments = await retrieveCommentByArticleID(id);
    for (const comment of allComments) {
        await deleteCommentByCommentID(comment.commentID);
    }
}

async function deleteCommentByPublisherID(id) {
    const db = await dbPromise;
    const allComments = await retrieveCommentByPublisherID(id);
    for (const comment of allComments) {
        await deleteCommentByCommentID(comment.commentID);
    }
}

// create, edit, delete articles
async function createNewArticle(title, publisherID, contents, date) {
    const db = await dbPromise;
    const newArtcile = await db.run(SQL`INSERT into articles(title,publisherID,publishTime,contents) values
                                        (${title},${publisherID},${date},${contents})`);
    return newArtcile.lastID;
}

async function editArtile(articleID, title, contents, date) {
    const db = await dbPromise;
    let editArtile = await db.run(SQL`
    update articles set title = ${title}, contents = ${contents},publishTime = ${date} where id = ${articleID}
    `)
}

async function deleteArticleByArticleID(articleID) {
    const db = await dbPromise;
    let deleteArticle = await db.run(SQL`DELETE FROM articles WHERE id = ${articleID}`)
}

async function deleteArticleByPublisherID(id) {
    const db = await dbPromise;
    await deleteCommentByPublisherID(id);
    await db.run(SQL`DELETE FROM articles
    WHERE publisherID = ${id};`);
}

// sort articles by title
async function sortArticlesByTitleASC() {
    const db = await dbPromise;
    const allArticles = await db.all(SQL`SELECT a.*,u.username as publisherName,u.avatar FROM articles a,users u WHERE a.publisherID = u.id ORDER BY title`);
    return allArticles;
}

async function sortArticlesByTitleDESC() {
    const db = await dbPromise;
    const allArticles = await db.all(SQL`SELECT a.*,u.username as publisherName,u.avatar FROM articles a,users u WHERE a.publisherID = u.id ORDER BY title DESC`);
    return allArticles;
}

// sort articles by date
async function sortArticlesByDateASC() {
    const db = await dbPromise;
    const allArticles = await db.all(SQL`SELECT a.*,u.username as publisherName,u.avatar FROM articles a,users u WHERE a.publisherID = u.id ORDER BY publishTime`);
    return allArticles;
}

async function sortArticlesByDateDESC() {
    const db = await dbPromise;
    const allArticles = await db.all(SQL`SELECT a.*,u.username as publisherName,u.avatar FROM articles a,users u WHERE a.publisherID = u.id ORDER BY publishTime DESC`);
    return allArticles;
}

// sort articles by username
async function sortArticlesByUsernameASC() {
    const db = await dbPromise;
    const allArticles = await db.all(SQL`SELECT a.*,u.username as publisherName,u.avatar FROM articles a,users u WHERE a.publisherID = u.id ORDER BY u.username`);
    return allArticles;
}

async function sortArticlesByUsernameDESC() {
    const db = await dbPromise;
    const allArticles = await db.all(SQL`SELECT a.*,u.username as publisherName,u.avatar FROM articles a,users u WHERE a.publisherID = u.id ORDER BY u.username DESC`);
    return allArticles;
}

// Export functions.
module.exports = {
    retrieveAllArticles,
    retrievePublisherNameByArticleID,
    retrievePublisherNameByArticleTitle,
    retrieveArticleByArticleID,
    retrieveCommentByArticleID,
    retrieveArticlesByUserID,
    updateUpvotesByUserIDAndCommentID,
    updateDownvotesByUserIDAndCommentID,
    createNewComment,
    deleteCommentByCommentID,
    deleteTreeCommentByCommentID,
    deleteCommentByArticleID,
    deleteArticleByPublisherID,
    createNewArticle,
    deleteCommentByPublisherID,
    editArtile,
    deleteArticleByArticleID,
    deleteCommentRecordByUserID,
    sortArticlesByDateASC,
    sortArticlesByDateDESC,
    sortArticlesByTitleASC,
    sortArticlesByTitleDESC,
    sortArticlesByUsernameASC,
    sortArticlesByUsernameDESC,
    getCurrentCommentStatus
};