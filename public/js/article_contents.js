window.addEventListener("load", async function () {

    // get global variables of this page
    const upvoteBtns = document.querySelectorAll(".upvote img");
    const downvoteBtns = document.querySelectorAll(".downvote img");
    const userID = document.querySelector("#LoginUserInfoDiv").innerHTML;
    const currentArticlePublisherID = parseInt(document.querySelector("#AritclePublisherInfoDiv").innerHTML);

    // refresh icons when reload/load article content page
    refreshCurrentIcons();

    // activate upvote/downvote icons 
    addVoteFunction(upvoteBtns, "updateUpvotes", 7);
    addVoteFunction(downvoteBtns, "updateDownvotes", 9);

    // activate comment and hide comment function
    addCommentFunction();
    addHideFunction();

    // refresh icon when reload/load article content page
    async function refreshCurrentIcons() {
        for (const voteBtn of upvoteBtns) {

            const currentUpAndDownVotesJSON = await fetch(`/getCurrentCommentStatus?commentID=${voteBtn.id.split("-")[1]}&userID=${userID}`);
            currentUpAndDownVotes = await currentUpAndDownVotesJSON.json();

            if (currentUpAndDownVotes.upvoteFlag === 1) {
                voteBtn.src = "./images/icons/likeon.png";
                voteBtn.classList.add("upvoteon");
            }
            if (currentUpAndDownVotes.downvoteFlag === 1) {
                const brotherBtn = document.querySelector(`#downvote-${voteBtn.id.split("-")[1]}`);
                brotherBtn.src = "./images/icons/dislikeon.png";
                brotherBtn.classList.add("downvoteon");
            }
        }
    }

    // single click when user want to hide comments, double click when user want to unfold comments
    async function addHideFunction() {
        const hiddenBtns = document.querySelectorAll(".hide-comment");
        const hiddenAllBtn = document.querySelector("#hide-all-comments");

        // activate "Hide All" btn
        hiddenAllBtn.addEventListener("click", function () {
            const allCommentContainer = document.querySelector("#article-comment-container");
            allCommentContainer.classList.toggle("hidden");
            if (allCommentContainer.classList.contains("hidden") == true) {
                hiddenAllBtn.innerHTML = "▼ Show All Nested Comments";
            } else {
                hiddenAllBtn.innerHTML = "▶ Hide All Nested Comments";
            }

        });

        // activate "Hide current sub comments" btn
        for (const hiddenBtn of hiddenBtns) {
            hiddenBtn.addEventListener("click", function () {
                const hiddenCommentID = hiddenBtn.id.split("-")[2];
                const commentUnorderList = document.querySelector(`#comment-ul-${hiddenCommentID}`);
                commentUnorderList.classList.toggle("hidden");

                if (commentUnorderList.classList.contains("hidden") == true) {
                    hiddenBtn.innerHTML = "▼ Show Nested Comments";
                } else {
                    hiddenBtn.innerHTML = "▶ Hide Nested Comments";
                }

            });
        }

        // disable and hide btns when logout
        if (userID.length === 0) {
            const divsOnlyDisplayWhenLogin = document.querySelectorAll(".displayOnlyLogin");
            for (const div of divsOnlyDisplayWhenLogin) {
                div.classList.add("hidden");
            }
        }
    }

    // activate upvote/downvote button
    async function addVoteFunction(voteBtns, routes, commentIDplace) {
        for (const voteBtn of voteBtns) {
            voteBtn.addEventListener("click", async function (event) {
                // refresh icons
                if (routes === "updateUpvotes") {
                    voteBtn.classList.toggle("upvoteon");
                    const brotherBtn = document.querySelector(`#downvote-${voteBtn.id.substring(commentIDplace)}`);
                    brotherBtn.classList.remove("downvoteon");
                    brotherBtn.src = "./images/icons/dislikeoff.png";
                    if (voteBtn.classList.contains("upvoteon")) {
                        addUpvoteFlash(event.clientX, event.clientY);
                        voteBtn.src = "./images/icons/likeon.png";
                    } else {
                        voteBtn.src = "./images/icons/likeoff.png";
                    }
                } else if (routes === "updateDownvotes") {
                    voteBtn.classList.toggle("downvoteon");
                    const brotherBtn = document.querySelector(`#upvote-${voteBtn.id.substring(commentIDplace)}`);
                    brotherBtn.classList.remove("upvoteon");
                    brotherBtn.src = "./images/icons/likeoff.png";
                    if (voteBtn.classList.contains("downvoteon")) {
                        voteBtn.src = "./images/icons/dislikeon.png";
                    } else {
                        voteBtn.src = "./images/icons/dislikeoff.png";
                    }
                }

                // display data
                const currentUpAndDownVotesJSON = await fetch(`/${routes}?commentID=${voteBtn.id.substring(commentIDplace)}&userID=${userID}`);
                currentUpAndDownVotes = await currentUpAndDownVotesJSON.json();
                const upvoteNum = document.querySelector(`#upvoteNum-${voteBtn.id.substring(commentIDplace)}`);
                upvoteNum.innerHTML ="Like: "+ currentUpAndDownVotes.upvoteNum;
                const downvoteNum = document.querySelector(`#downvoteNum-${voteBtn.id.substring(commentIDplace)}`);
                downvoteNum.innerHTML ="Dislike: "+ currentUpAndDownVotes.downvoteNum;
            });
        }
    }

    // add a lovely flash only when clicking like btn
    async function addUpvoteFlash(x, y) {
        const heart = document.createElement("img");
        const index = parseInt(Math.random() * 6 + 1);
        heart.src = `./images/hearts/heart${index}.png`;
        heart.style.width = "30px";
        heart.style.height = "30px";
        heart.classList.add("fly-hearts");
        heart.style.top = `${parseInt(y) - 30}px`;
        heart.style.left = `${parseInt(x) - 15}px`;
        heart.setAttribute("z-index", 1);
        
        const body = document.querySelector("body");
        body.appendChild(heart);

        setTimeout(function () {
            heart.style.display = "none";
        }, 2000);
    }

    // 
    async function addCommentFunction() {

        const commentBtns = document.querySelectorAll(".commentBtn");
        for (const commentBtn of commentBtns) {
            const commentToArticleID = parseInt(commentBtn.id.split("-")[1]);
            const replyToCommentID = parseInt(commentBtn.id.split("-")[2]);
            const currentUserID = parseInt(userID);
            const publisherID = parseInt(commentBtn.id.split("-")[3]);

            let deleteLink = undefined;
            let lastBtn = undefined;

            // you cannot comment to an article, you can only comment to existing comments
            if (replyToCommentID !== 0) {
                deleteLink = createPossibleDeleteBtn(currentUserID, publisherID, replyToCommentID, commentToArticleID, commentBtn);
            }

            // make sure the comment form will always be the last element
            if (deleteLink !== undefined) {
                lastBtn = deleteLink;
            } else {
                lastBtn = commentBtn;
            }

            // remove old form, add new form  
            commentBtn.addEventListener("click", async function () {               
                const previousFormHere = document.querySelector(`#commentForm-${commentToArticleID}-${replyToCommentID}-${currentUserID}`);

                const allPreviousForm = document.querySelectorAll(".commentForm");
                for (const previousForm of allPreviousForm) {
                    previousForm.remove();
                }

                if (!previousFormHere) {
                    createCommentForm(commentToArticleID, replyToCommentID, currentUserID, lastBtn);
                }
            });
        }
    }

    // create delete btn only when user have rights to delete comments
    function createPossibleDeleteBtn(currentUserID, publisherID, commentID, currentArticleID, afterEle) {
        // user may delete comment only when:
        // they are deleting their own comments
        // or they are deleting comments beneath their own articles
        if (currentUserID === publisherID || currentUserID === currentArticlePublisherID) {
            const deleteLink = document.createElement("a");
            deleteLink.href = `/deleteComment?commentID=${commentID}&articleID=${currentArticleID}&publisherID=${currentArticlePublisherID}`;
            deleteLink.style.textDecoration = "none";
            deleteLink.innerHTML = "  ";

            const deleteBtn = document.createElement("img");
            deleteBtn.src = "./images/icons/delete.png";
            deleteBtn.classList.add("deleteCommentBtn");

            deleteLink.appendChild(deleteBtn);
            insertAfter(deleteLink, afterEle);
            return deleteLink;
        }
    }

    // when click comment btn, create a new form to submit comments
    function createCommentForm(commentToArticleID, replyToCommentID, currentUserID, afterEle) {
        const commentForm = document.createElement("form");
        commentForm.setAttribute("action", "/createNewComment");
        commentForm.setAttribute("method", "POST");
        commentForm.setAttribute("id", `commentForm-${commentToArticleID}-${replyToCommentID}-${currentUserID}`)
        commentForm.setAttribute("class", "commentForm");

        const commentBoxContainer = document.createElement("div");
        commentBoxContainer.style.margin = "15px 0";

        const commentBox = document.createElement("textarea");
        commentBox.setAttribute("required", true);
        commentBox.setAttribute("maxlength", "400");
        commentBox.setAttribute("cols", "40vw");
        commentBox.setAttribute("rows", 5);
        commentBox.name = "contents";
        commentBox.classList.add("commentTextarea");

        const submitButton = document.createElement("input");
        submitButton.type = "submit";
        submitButton.style.float = "right";
        submitButton.classList.add("commentSubmitBtn");
        submitButton.setAttribute("value","Submit");


        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = "hiddenInfo";
        hiddenInput.value = `${commentToArticleID}-${replyToCommentID}-${currentUserID}`;

        const br = document.createElement("br");

        commentBoxContainer.appendChild(commentBox);
        commentBoxContainer.appendChild(br);
        commentBoxContainer.appendChild(submitButton);

        commentForm.appendChild(commentBoxContainer);
        commentForm.appendChild(hiddenInput);
        if (replyToCommentID === 0) {
            insertAfter(commentForm, afterEle.parentNode);

        } else {
            insertAfter(commentForm, afterEle.parentNode.parentNode);
        }

    }

    // insert a new element after target element
    function insertAfter(newElement, targetElement) {
        var parent = targetElement.parentNode;
        if (parent.lastChild == targetElement) {
            parent.appendChild(newElement);
        }
        else {
            parent.insertBefore(newElement, targetElement.nextSibling);
        }
    }

});