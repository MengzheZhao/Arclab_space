-- Run this script to create or re-initialize the database.
drop table if exists votes;
drop table if exists comments;
drop table if exists articles;
drop table if exists users;

CREATE TABLE "users" (
  "id" integer NOT NULL,
  "username" varchar(64) NOT NULL unique,
  "password" varchar(64) NOT NULL,
  "name" varchar(64),
  "birthday" date,
  "authToken" varchar(128),
  "avatar" varchar(128),
  "description" text,
  "role" varchar(20),
   PRIMARY KEY ("id")
);

create table articles(
        id integer not null primary key,
        title char,
        publisherID integer not null,
        publishTime timestamp not null,
        contents text not null,   
        foreign key (publisherID) references users(id)
);

create table if not exists comments(
    articleID integer not null,
    commentID integer not null,
    replyToID integer default 0,
	publisherID integer not null,
    contents text not null,
    commentTime timestamp not null,
	upvote INTEGER DEFAULT 0,
	downvote INTEGER DEFAULT 0,
    primary key(articleID,commentID,replyToID),
    foreign key(articleID) references articles(id),
	FOREIGN KEY(publisherID)REFERENCES users(id)
);

CREATE TABLE if not EXISTS votes(
	userID INTEGER NOT NULL,
	commentID INTEGER NOT NULL,
	haveUpvoted INTEGER DEFAULT 0,
	firstTimeUpvote INTEGER DEFAULT 1,
	haveDownvoted INTEGER DEFAULT 0,
	firstTimeDownvote INTEGER DEFAULT 1,
	PRIMARY key(userID,commentID)
);

INSERT INTO "users" VALUES
(1, 'admin', 'a996f09397f77c9bd1a05890aff2ae68', 'admin', '2021-05-01', '8419bade-787b-411a-8d6a-360f25bfb006', 'avatar35.jpg', 'Hello,world!', 'admin');