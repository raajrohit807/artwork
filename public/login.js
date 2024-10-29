document.getElementById('loginForm').onsubmit = async function(event) {
    event.preventDefault(); // Prevent the default form submission

    const formData = new FormData(event.target);
    const data = {};
    formData.forEach((value, key) => { data[key] = value }); // Collect form data

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data), // Send the data as JSON
        });

        // Check if the response is ok (status in the range 200-299)
        if (response.ok) {
            const result = await response.json(); // Parse the JSON response
            if (result.token) {
                // Store the token in local storage
                localStorage.setItem('token', result.token);
                window.location.href = '/home'; // Redirect to the home page
            } else {
                alert('Login failed: No token received.'); // Handle unexpected response
            }
        } else {
            // Handle error responses based on status code
            const errorMessage = await response.text();
            alert(`Login failed: ${errorMessage}`); // Alert the user about the error
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.'); // General error alert
    }
};