window.addEventListener("load", function () {

    //select the edit and delete button
    const editBtns = document.querySelectorAll(".editBtn");
    const deleteBtns = document.querySelectorAll(".deleteBtn");
    
    // add the function to each button
    for(editBtn of editBtns){

        editBtn.addEventListener("click",async function(){
            //Remind the user to confirm if they want to edit their article
                if(confirm("edit your article?")){
                   const articleID = editBtn.id.split("-")[1];
                    const editID = editBtn.id.split("-")[2];
                    window.location.href=`/newArticle?articleID=${articleID}&editID=${editID} `;// send article id and edit choice to server side
                }

        });
    }

    for(deleteBtn of deleteBtns){

        deleteBtn.addEventListener("click",function(){

        // Remind the user to confirm if they want to delete their article
                if(confirm("Delete your article?")){
                    const articleID = editBtn.id.split("-")[1];
                    const editID = editBtn.id.split("-")[2];
                    window.location.href=`/deleteArticle?articleID=${articleID}&editID=${editID} `;// send article id and edit choice to server side
                }
        });
    }
});