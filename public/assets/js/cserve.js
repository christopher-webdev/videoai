document
    .getElementById('signup-form')
    .addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent default form submission

        const signupMessage = document.getElementById('signup-message');
        signupMessage.innerText = 'Loading...';
        signupMessage.style.color = 'yellow';

        const formData = new FormData(this);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        if (data.password !== data.confirmPassword) {
            signupMessage.innerText = 'Passwords do not match.';
            signupMessage.style.color = 'lightcoral';
            return;
        }

        try {
            const response = await axios.post('/api/signup', data);

            if (response.status === 200) {
                signupMessage.innerText = response.data.msg;
                signupMessage.style.color = 'lightgreen';

                if (response.data.redirect) {
                    // Wait for 2 seconds before redirecting
                    setTimeout(() => {
                        window.location.href = response.data.redirect;
                    }, 2000);
                }
            } else {
                signupMessage.innerText = response.data.msg
                    ? response.data.msg
                    : 'Something went wrong';
                signupMessage.style.color = 'lightcoral';
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.errors) {
                signupMessage.innerText = err.response.data.errors
                    .map((error) => error.msg)
                    .join(', ');
            } else if (
                err.response &&
                err.response.data &&
                err.response.data.msg
            ) {
                signupMessage.innerText = err.response.data.msg;
            } else {
                signupMessage.innerText = 'Server error';
            }
            signupMessage.style.color = 'lightcoral';
        }
    });
