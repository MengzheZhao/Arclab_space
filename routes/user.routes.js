const express = require("express");
const router = express.Router();
const userDao = require("../modules/users-dao.js");
const articlesDao = require("../modules/articles-dao.js");

router.get('/api/users', async function(req, res) {
    const user = await userDao.retrieveUserWithAuthToken(req.cookies.authToken || req.headers.authtoken);
    if (user && user.role === 'admin') {
        let users = await userDao.retrieveAllUsers();
        users = users.filter(u => u.id != user.id);
        res.json(users);
    } else {
        res.status(401).send();
    }
});

router.delete('/api/users/:id', async function(req, res) {
    const id = req.params.id;
    const user = await userDao.retrieveUserWithAuthToken(req.cookies.authToken || req.headers.authtoken);
    if (user && user.role === 'admin') {
        const deleteUser = await userDao.retrieveUserById(id);
        if (!deleteUser) {
            res.status(401).send();
        } else {
            await articlesDao.deleteArticleByPublisherID(id);
            await articlesDao.deleteCommentRecordByUserID(id);
            await userDao.deleteUser(id);
            res.status(204).send();
        }
    } else {
        res.status(401).send();
    }
});

module.exports = router;
