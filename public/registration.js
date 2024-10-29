function validateForm() {
    var name = document.getElementById("name").value;
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var contact = document.getElementById("contact").value;

    if (name === "" || email === "" || password === "" || contact === "") {
        alert("Please fill out all fields.");
        return false;
    }

    // Basic email validation
    var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailPattern.test(email)) {
        alert("Please enter a valid email address.");
        return false;
    }

    // Contact number validation
    var contactPattern = /^[0-9]{10}$/;
    if (!contactPattern.test(contact)) {
        alert("Please enter a valid 10-digit contact number.");
        return false;
    }

    alert("Registration Successful!");
    return true;
}
