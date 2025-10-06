const user = document.getElementById('name');
const userEmail = document.getElementById('email');
const userPassword = document.getElementById('password');
const form = document.getElementById("signupForm");

form.addEventListener('submit', saveUser);

function saveUser(e) {
    e.preventDefault();
    
    if (user.value.trim() === "" || userEmail.value.trim() === "" || userPassword.value.trim() === "") {
        alert("Please fill in all fields.");
        return;
    }


    let obj = {
        name: user.value.trim(),
        email: userEmail.value.trim(),
        password: userPassword.value.trim()
    };
    axios.post("http://localhost:3000/user/signup", obj)
        .then((result) => {
            console.log(result);
            resetForm();
        })
        .catch((err) => {
            console.log(err);
            alert("user with this amail aleady exists");
            resetForm();
        });
}


function resetForm() {
    user.value = "";
    userEmail.value = "";
    userPassword.value = "";
}
