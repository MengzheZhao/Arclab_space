window.addEventListener("load", function () {
    const titleOrderBtn = document.querySelector("#titleOrderBtn");
    titleOrderBtn.addEventListener("click", function () {
        if (titleOrderBtn.innerHTML === "Order By Title ASC") {
            titleOrderBtn.innerHTML = "Order By Title DESC";
        } else {
            titleOrderBtn.innerHTML = "Order By Title ASC";
        }
    });

});