const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");

/**
 * Inserts the given user into the database. Then, reads the ID which the database auto-assigned, and adds it
 * to the user.
 * 
 * @param user the user to insert
 */
async function createUser(user) {
    const db = await dbPromise;

    const result = await db.run(SQL`
        insert into users (username, password, name, birthday, description, authToken, avatar) values(${user.username}, ${user.password}, ${user.name}, ${user.birthday}, ${user.description}, ${null}, ${user.avatar})`);

    // Get the auto-generated ID value, and assign it back to the user object.
    user.id = result.lastID;
}

/**
 * Gets the user with the given id from the database.
 * If there is no such user, undefined will be returned.
 * 
 * @param {number} id the id of the user to get.
 */
async function retrieveUserById(id) {
    const db = await dbPromise;

    const user = await db.get(SQL`
        select * from users
        where id = ${id}`);

    return user;
}

/**
 * Gets the user with the given username and password from the database.
 * If there is no such user, undefined will be returned.
 * 
 * @param {string} username the user's username
 * @param {string} password the user's password
 */
async function retrieveUserWithCredentials(username, password) {
    const db = await dbPromise;

    const user = await db.get(SQL`
        select * from users
        where username = ${username} and password = ${password}`);

    return user;
}

/**
 * Gets the user with the given authToken from the database.
 * If there is no such user, undefined will be returned.
 * 
 * @param {string} authToken the user's authentication token
 */
async function retrieveUserWithAuthToken(authToken) {
    const db = await dbPromise;

    const user = await db.get(SQL`
        select * from users
        where authToken = ${authToken}`);

    return user;
}

/**
 * Gets the user with the given username from the database.
 * If there is no such user, undefined will be returned.
 * 
 * @param {string} username the user's username
 */
async function retrieveUserByUsername(username) {
    const db = await dbPromise;

    const user = await db.get(SQL`
        select * from users
        where username = ${username}`);

    return user;
}

/**
 * Gets an array of all users from the database.
 */
async function retrieveAllUsers() {
    const db = await dbPromise;

    const users = await db.all(SQL`select id,username,name,birthday,description from users`);

    return users;
}

/**
 * Gets an array of all users from the database.
 */
async function retrieveAllUsersAndArticleCount() {
    const db = await dbPromise;

    const users = await db.all(SQL`SELECT u.id, u.username, u.name, u.birthday, u.authToken, u.avatar, u.description,
    COUNT(a.publisherID) as articleCount from users u JOIN articles a ON a.publisherID = u.id GROUP BY a.publisherID`);

    return users;
}

/**
 * Updates the given user in the database, not including auth token
 * 
 * @param user the user to update
 */
async function updateUser(user) {
    const db = await dbPromise;

    await db.run(SQL`
        update users
        set username = ${user.username}, name = ${user.name},
            authToken = ${user.authToken}, birthday = ${user.birthday},
            description = ${user.description}, avatar = ${user.avatar} 
        where id = ${user.id}`);
}

/**
 * Updates the given user avatar in the database
 *
 * @param avatar the user avatar to update
 */
async function updateUserAvatar(userId, avatar) {
    const db = await dbPromise;

    await db.run(SQL`
        update users
        set avatar = ${avatar} 
        where id = ${userId}`);
}

/**
 * Deletes the user with the given id from the database.
 * 
 * @param {number} id the user's id
 */
async function deleteUser(id) {
    const db = await dbPromise;

    await db.run(SQL`
        delete from users
        where id = ${id}`);
}

async function changePassword(user) {
    const db = await dbPromise;

    await db.run(SQL`
        update users
        set password = ${user.password}
        where id = ${user.id}`);
}

// Export functions.
module.exports = {
    createUser,
    retrieveUserById,
    retrieveUserWithCredentials,
    retrieveUserWithAuthToken,
    retrieveUserByUsername,
    retrieveAllUsersAndArticleCount,
    retrieveAllUsers,
    updateUser,
    deleteUser,
    updateUserAvatar,
    changePassword
};
