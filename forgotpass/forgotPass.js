const userEmail = document.getElementById('email');
const form = document.getElementById("sendEmailForm");
const sendEmailFormBtn = document.getElementById("sendEmailBtn");

form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (userEmail.value.trim() === "") {
        alert("Please fill in all fields.");
        return;
    };

    let obj = {email: userEmail.value.trim()};
    axios.post("http://localhost:3000/forgotPass/pass", obj).then((result) => {
        console.log(result.data);
        alert(result.data.message);
        window.location.href = '../login/login.htm'
        resetForm();
    }).catch((err) => {
        console.log(err);
    });
});

function resetForm() {
    userEmail.value = "";
}