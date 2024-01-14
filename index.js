const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const env = require('dotenv'); 
const argon2 = require('argon2');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
env.config(); // Initialize dotenv

// Connect to MongoDB using Mongoose
mongoose.connect(`mongodb+srv://abish:l2TFchymzqLLYAOY@cluster0.btfwxae.mongodb.net/?retryWrites=true&w=majority`,);

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

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied. Token not provided.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });

    req.user = user;
    next();
  });
};

// Signup route with JWT token
app.post('/signup', async (req, res) => {
  try {
    const { email, name, phoneNumber, age, maritalStatus, gender, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Hash the password using argon2
    const hashedPassword = await argon2.hash(password);

    // Create a new user with hashed password
    const newUser = new User({ email, name, password: hashedPassword, phoneNumber, age, maritalStatus, gender });

    // Save the user to the database
    await newUser.save();

    // Generate JWT token with email and user ID
    const token = jwt.sign(
      { userId: newUser._id, name, email, phoneNumber, age, maritalStatus, gender },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Respond with the token
    res.status(201).json({ token });
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

    // Check if the password matches using argon2
    const passwordMatch = await argon2.verify(user.password, password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // If both email and password match, generate a token
    const token = jwt.sign({ userId: user._id, email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Send the token and user ID in the response
    res.status(200).json({ token, userId: user._id });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/payment/orders', async (req, res) => {
  console.log('order');
  try {
    const instance = new Razorpay({
      key_id: process.env.RZYKEY_ID,
      key_secret: process.env.RZYSECRET_KEY,
    });

    const options = {
      amount: req.body.amount * 100,
      currency: 'INR',
      receipt: crypto.randomBytes(10).toString('hex'),
    };

    instance.orders.create(options, (error, order) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: 'Something Went Wrong' });
      }
      console.log(order);
      res.status(200).json({ data: order });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/api/payment/orders', (req, res) => {
  res.send('Hey');
});

app.post('/api/payment/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac('sha256', process.env.RZY_SECRET_KEY)
      .update(sign.toString())
      .digest('hex');

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    } else {
      return res.status(200).json({ message: 'Payment verified successfully' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/userdata/:id', async (req, res) => {
  const requestedUserId = req.params.id;
  try {
    const requestedUser = await User.findById(requestedUserId);

    if (!requestedUser) {
      return res.status(404).json({ error: 'User not found' });
    } else {
      const userData = {
        userId: requestedUser._id,
        name: requestedUser.name,
        email: requestedUser.email,
        phoneNumber: requestedUser.phoneNumber,
        age: requestedUser.age,
        maritalStatus: requestedUser.maritalStatus,
        gender: requestedUser.gender,
      };

      res.status(200).json(userData);
    }
  } catch (error) {
    console.error('Error fetching user data:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
