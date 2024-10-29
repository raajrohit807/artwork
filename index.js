const express = require("express");
const fs = require("fs");
const path = require('path');
const bcrypt = require("bcrypt"); 
const app = express();
const bodyParser = require("body-parser");
const session = require("express-session");
const port = 3000; // Keep your backend port 3000

const mongoose = require('mongoose');

//authentication function
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1]; // Bearer token

    if (!token) {
        return res.redirect('/login'); // Redirect to login if no token
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.redirect('/login'); // Redirect to login if token is invalid
        req.user = user; // Attach user information to the request
        next(); // Proceed to the next middleware or route handler
    });
}
// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ArtGallery', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret';

// Middleware for sessions
app.use(session({
    secret: 'your-secret-key', // Change this to a strong secret
    resave: false,
    saveUninitialized: true,
}));


// Middleware to parse form data
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Serve static files from the 'public' directory
app.use(express.static('public'));


// Login Route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }); // Find user by email

        if (!user) {
            return res.status(404).send('User  not found. Please create an account.');
        }

        // Compare password with hashed password
        if (bcrypt.compareSync(password, user.password)) {
            // Create a JWT token
            const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour
            res.json({ token }); // Send token to the client
        } else {
            res.status(401).send('Incorrect password. Please try again.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error reading user data');
    }
});

// Protected route
app.get('/protected', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header

    if (!token) {
        return res.status(403).send('No token provided');
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send('Unauthorized');
        }

        // If the token is valid, proceed to the protected resource
        res.json({ message: 'This is protected data', user: decoded });
    });
});

app.get('/', (req, res)=>{
    res.send(`its working at ${port}`);
});

// Serve home.html
// app.get('/home', authenticateToken, (req, res) => {
//     res.sendFile(__dirname + '/public/home.html');
// });
app.get('/home', (req, res) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1]; // Bearer token

    if (!token) {
        // If no token is provided, redirect to login
        return res.redirect('/login');
    }

    // Verify the token
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // If token is invalid, redirect to login
            return res.redirect('/login');
        }

        // If the token is valid, serve the home page
        res.sendFile(path.join(__dirname, 'public', 'home.html'));
    });
});

app.get('/profile',(req,res) => {
    res.sendFile(__dirname + '/public/profile.html');
})

// Registration endpoint remains the same
// app.post('/register', (req, res) => {
//     const { name, email, password, contact } = req.body;

//     if (!name || !email || !password || !contact) {
//         res.status(400).send('Please fill in all the fields');
//         return;
//     }

//     // Hash the password
//     const hashedPassword = bcrypt.hashSync(password, 10);

//     const newUser = { name, email, password: hashedPassword, contact };

//     console.log(newUser)
//     const filePath = __dirname + '/users.json';

//     fs.readFile(filePath, (err, data) => {
//         if (err) {
//             if (err.code === 'ENOENT') {
//                 fs.writeFile(filePath, JSON.stringify([newUser], null, 2), (err) => {
//                     if (err) {
//                         res.status(500).send('Error saving user');
//                         return;
//                     }
//                     res.redirect('/home');
//                 });
//             } else {
//                 res.status(500).send('Error reading user data');
//             }
//             return;
//         }

//         const users = JSON.parse(data);
//         users.push(newUser);

//         fs.writeFile(filePath, JSON.stringify(users, null, 2), (err) => {
//             if (err) {
//                 res.status(500).send('Error saving user');
//                 return;
//             }
//             res.redirect('/home');
//         });
//     });
// });

const User = require('./models/User'); // Import the User model

app.post('/register', async (req, res) => {
    const { name, email, password, contact } = req.body;

    if (!name || !email || !password || !contact) {
        res.status(400).send('Please fill in all the fields');
        return;
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser  = new User({ name, email, password: hashedPassword, contact });

    try {
        await newUser .save(); // Save the user to the database
        res.redirect('/home');
    } catch (err) {
        if (err.code === 11000) { // Duplicate key error
            res.status(400).send('User  with this email already exists.');
        } else {
            res.status(500).send('Error saving user');
        }
    }
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html')); // Adjust the path to where login.html is located
});


// Route for logging out
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Could not log out.');
        }
        res.redirect('/login'); // Redirect to login page
    });
});

// Route to get user details:
app.get('/api/user', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id); // Fetch user by ID from token
        if (!user) {
            return res.status(404).send('User  not found');
        }
        res.json(user); // Send user details as JSON response
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving user data');
    }
});

// Users list route can also be protected if necessary
app.get('/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find(); // Retrieve all users
        res.json(users); // Send users as JSON response
    } catch (err) {
        res.status(500).send('Error retrieving users');
    }
});


//users list
app.get('/users', async (req, res) => {
    try {
        const users = await User.find(); // Retrieve all users
        res.json(users); // Send users as JSON response
    } catch (err) {
        res.status(500).send('Error retrieving users');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
