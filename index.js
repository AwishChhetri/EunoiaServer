const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

// Connect to MongoDB using Mongoose
mongoose.connect('mongodb+srv://abish:l2TFchymzqLLYAOY@cluster0.btfwxae.mongodb.net/?retryWrites=true&w=majority', {
  
});

// Create a User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phoneNumber: String,
  age: Number,
  maritalStatus: String,
  gender: String,
});

// Create a User model
const User = mongoose.model('User', userSchema);

// Signup route with JWT token
app.post('/signup', async (req, res) => {
  try {
    const {  email,
        phoneNumber,
        age,
        maritalStatus,
        gender,
        password} = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({ email, password: hashedPassword , phoneNumber,
        age,
        maritalStatus,
        gender});

    // Save the user to the database
    await newUser.save();
    console.log(newUser)
    // Generate JWT token with email and user ID
    const token = jwt.sign({ userId: newUser._id, email,phoneNumber,
        age,
        maritalStatus,
        gender }, 'your_secret_key', {
      expiresIn: '1h',
    });

    // Respond with the token
    res.status(201).json({ token });
    console.log(token)
  } catch (error) {
    console.error('Error during signup:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find the user with the provided email
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
  
      // Compare the provided password with the hashed password in the database
      const passwordMatch = await bcrypt.compare(password, user.password);
  
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
  
      // Generate JWT token with email and user ID
      const token = jwt.sign({ userId: user._id, email,phoneNumber,
        age,
        maritalStatus,
        gender }, 'your_secret_key', {
        expiresIn: '1h',
      });
  
      // Respond with the token
      res.json({ token });
    } catch (error) {
      console.error('Error during login:', error.message);
      res.status(500).send('Internal Server Error');
    }
  });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
